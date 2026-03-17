/**
 * Notion API Client
 */

import { Client, APIResponseError } from '@notionhq/client';
import { Logger } from '../utils/Logger';

export type NotionStatus = 'idle' | 'running' | 'generating';
export type NotionConnectionStatus = 'connected' | 'disconnected' | 'error';

export interface NotionConfig {
  token: string;
  databaseId: string;
}

export interface StatusChangeRecord {
  machineName: string;
  status: NotionStatus;
  ip: string;
  port: number;
  timestamp: Date;
  connectionStatus: NotionConnectionStatus;
  previousStatus: NotionStatus;
}

export class NotionClientClass {
  private client: Client | null = null;
  private databaseId: string | null = null;
  private token: string | null = null;
  private initialized: boolean = false;

  /**
   * Initialize Notion client
   */
  init(config: NotionConfig): void {
    Logger.info('Initializing Notion client', { databaseId: config.databaseId });
    
    this.client = new Client({
      auth: config.token,
    });
    this.token = config.token;
    this.databaseId = config.databaseId;
    this.initialized = true;
  }

  /**
   * Test connection to Notion API
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.client || !this.databaseId) {
      return { success: false, error: 'Notion client not initialized' };
    }

    try {
      // Try to retrieve the database to verify access
      await this.client.databases.retrieve({
        database_id: this.databaseId,
      });

      // Auto-create required columns if they don't exist
      await this.ensureSchema();

      Logger.info('Notion connection test successful');
      return { success: true };
    } catch (error) {
      const errorMessage = this.parseError(error);
      Logger.error('Notion connection test failed', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Ensure the database has all required columns
   */
  private async ensureSchema(): Promise<void> {
    if (!this.token || !this.databaseId) return;

    try {
      await fetch(`https://api.notion.com/v1/databases/${this.databaseId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            '狀態': {
              select: {
                options: [
                  { name: 'idle', color: 'green' },
                  { name: 'running', color: 'yellow' },
                  { name: 'generating', color: 'blue' },
                ],
              },
            },
            'IP 位置': { rich_text: {} },
            '時間戳記': { date: {} },
            '連接狀態': {
              select: {
                options: [
                  { name: 'connected', color: 'green' },
                  { name: 'disconnected', color: 'gray' },
                  { name: 'error', color: 'red' },
                ],
              },
            },
            '前狀態': {
              select: {
                options: [
                  { name: 'idle', color: 'green' },
                  { name: 'running', color: 'yellow' },
                  { name: 'generating', color: 'blue' },
                ],
              },
            },
          },
        }),
      });
      Logger.info('Notion database schema ensured');
    } catch (error) {
      Logger.error('Failed to ensure Notion schema', { error });
    }
  }

  /**
   * Upsert a status change record (Create if missing, update if exists)
   */
  async upsertStatusRecord(record: StatusChangeRecord): Promise<{ success: boolean; pageId?: string; error?: string }> {
    if (!this.client || !this.databaseId) {
      return { success: false, error: 'Notion client not initialized' };
    }

    try {
      const properties = {
        'Name': {
          title: [
            {
              text: {
                content: record.machineName,
              },
            },
          ],
        },
        '狀態': {
          select: {
            name: record.status,
            color: this.getStatusColor(record.status),
          },
        },
        'IP 位置': {
          rich_text: [
            {
              text: {
                content: `${record.ip}:${record.port}`,
              },
            },
          ],
        },
        '時間戳記': {
          date: {
            start: record.timestamp.toISOString(),
          },
        },
        '連接狀態': {
          select: {
            name: record.connectionStatus,
            color: this.getConnectionColor(record.connectionStatus),
          },
        },
        '前狀態': {
          select: {
            name: record.previousStatus,
            color: this.getStatusColor(record.previousStatus),
          },
        },
      };

      // Search for an existing record with the exact machineName
      // Note: @notionhq/client v5 removed databases.query, so we use raw fetch
      const queryResponse = await fetch(`https://api.notion.com/v1/databases/${this.databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: {
            property: 'Name',
            title: {
              equals: record.machineName,
            },
          },
        }),
      });
      const existingQuery = await queryResponse.json() as { results: { id: string }[] };

      let response;
      if (existingQuery.results.length > 0) {
        // Update the first matching row
        response = await this.client.pages.update({
          page_id: existingQuery.results[0].id,
          properties: properties,
        });
        Logger.debug('Notion page updated (upsert)', { pageId: response.id });
      } else {
        // Did not exist, create a new row
        response = await this.client.pages.create({
          parent: { database_id: this.databaseId },
          properties: properties,
        });
        Logger.debug('Notion page created (upsert)', { pageId: response.id });
      }

      return { success: true, pageId: response.id };
    } catch (error) {
      const errorMessage = this.parseError(error);
      Logger.error('Failed to upsert Notion record', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get status color for Notion select
   */
  private getStatusColor(status: NotionStatus): 'green' | 'yellow' | 'blue' | 'gray' {
    switch (status) {
      case 'idle':
        return 'green';
      case 'running':
        return 'yellow';
      case 'generating':
        return 'blue';
      default:
        return 'gray';
    }
  }

  /**
   * Get connection status color for Notion select
   */
  private getConnectionColor(status: NotionConnectionStatus): 'green' | 'gray' | 'red' {
    switch (status) {
      case 'connected':
        return 'green';
      case 'disconnected':
        return 'gray';
      case 'error':
        return 'red';
      default:
        return 'gray';
    }
  }

  /**
   * Parse Notion API error
   */
  private parseError(error: any): string {
    if (error instanceof APIResponseError) {
      switch (error.code) {
        case 'unauthorized':
          return 'Notion Token 無效或已過期';
        case 'restricted_resource':
          return '無權限訪問此資料庫，請確認已分享給 integration';
        case 'object_not_found':
          return '資料庫不存在或 ID 錯誤';
        case 'rate_limited':
          return 'API 請求過於頻繁，請稍後再試';
        default:
          return `Notion API 錯誤：${error.message}`;
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return '未知錯誤';
  }

  /**
   * Check if client is initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.client !== null && this.databaseId !== null;
  }

  /**
   * Reset client
   */
  reset(): void {
    this.client = null;
    this.databaseId = null;
    this.token = null;
    this.initialized = false;
    Logger.info('Notion client reset');
  }
}

// Export singleton instance
export const notionClient = new NotionClientClass();
