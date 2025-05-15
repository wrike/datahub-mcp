export type Database = {
  databaseId: string
  title: string,
  rootFolderId: string,
  databaseRecordName?: string,
  recordCount?: number
}

export type Space = {
  rootFolderId: string,
  title: string,
  type: string
}

export class DatahubClient {
  private baseUrl: string;
  private headers: { Authorization: string; "Content-Type": string; "User-Agent": string; "X-MCP-Client": string };

  constructor(token: string, host: string) {
    this.baseUrl = `https://${host}/app/wrike_v2_web`;
    this.headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": 'Datahub-MCP/1.0.0',
      "X-MCP-Client": "true"
    };
  }

  async listSpaces(): Promise<Space[]> {
    const query: RootQuery = {
      objectTypeId: "s:type:RootQuery",
      rootObjectIds: ["d:query:root"],
      references: [
          {
              id: "s:reference:rootFolders",
              properties: ["s:property:id"],
              references: [
                {
                  id: "s:reference:space",
                  properties: ["s:property:id", "s:property:name", "s:property:spaceType", "s:property:rootFolderId"],
                  filters: [
                    {
                      propertyId: "s:property:spaceType",
                      operatorId: "s:comp_optor:anyOf",
                      value: ["Public", "Private"]
                    }
                  ]
                }
              ]
          }
      ]
    }

    const response = await fetch(
      `${this.baseUrl}/platform/api/v1/query`,
      { 
          headers: this.headers,
          method: 'POST',
          body: JSON.stringify({query: query})
       }
    )

    if (!response.ok) {
        throw new Error(`Failed to get databases: ${response.statusText}`);
    }

    const data = await response.json()

    const rootQuery = data["data"]["objects"]["d:query:root"];

    type Space = {
      "s:property:name": string,
      "s:property:spaceType": "Public" | "Private",
      "s:property:rootFolderId": string
    }

    const folders = rootQuery["s:reference:rootFolders"] as any[];
    if (!folders) {
        return [];
    }
  
    return Object.values(folders).map(folder => folder["s:reference:space"] as Space).filter(i => i).map(item => ({
        rootFolderId: convertId(item["s:property:rootFolderId"]),
        title: item["s:property:name"],
        type: item["s:property:spaceType"]
    }))
  }

  async listDatabases(rootFolderIds?: string[], nameContains?: string): Promise<Database[]> {
    const parentFilter: Filter | null = rootFolderIds && rootFolderIds.length > 0
    ? { propertyId: "s:property:rootId", operatorId: "s:comp_optor:anyOf", value: rootFolderIds.map(convertId)} 
    : null

    const nameFilter: Filter | null = nameContains
    ? { propertyId: "s:property:name", operatorId: "s:comp_optor:stringContains", value: nameContains}
    : null

    const query: RootQuery = {
        objectTypeId: "s:type:ExternalSource",
        rootObjectIds: ["s:xsrc:wdh"],
        references: [
            {
                id: "s:reference:externalTypes",
                properties: ["s:property:id", "s:property:name", "s:property:parentId", "s:property:rootId"],
                filters: [parentFilter, nameFilter].filter(f => f != null)
            }
        ]
    }

    const response = await fetch(
        `${this.baseUrl}/platform/api/v1/query`,
        { 
            headers: this.headers,
            method: 'POST',
            body: JSON.stringify({query: query})
         }
      )

    if (!response.ok) {
        throw new Error(`Failed to get databases: ${response.statusText}`);
    }

    const data = await response.json()

    const rootQuery = data["data"]["objects"]["s:xsrc:wdh"];

    type List = {
        "s:property:id": string, 
        "s:property:name": string,
        "s:property:parentId": string,
        "s:property:rootId": string
    }

    const lists = rootQuery["s:reference:externalTypes"];
    if (!lists) {
        return [];
    }
    
    return Object.values(lists).map(i => i as List).map(item => ({
        databaseId: item["s:property:id"].replace("w2:mod:", "DB"),
        title: item["s:property:name"],
        rootFolderId: convertId(item["s:property:rootId"])
    }))
  }

  async getDatabase(databaseId: string): Promise<Database> {
    if (!databaseId || !databaseId.startsWith("DB")) {
      throw new Error("DatabaseId required");
    }

    const id = databaseId.replace("DB", "w2:mod:")

    const query: RootQuery = {
      objectTypeId: "s:type:list",
      rootObjectIds: [id],
      properties: ["s:property:name", "s:property:rootId", "s:property:listItemsTypeName"],
      references: [
        {
          id: "s:reference:dataItems",
          properties: ["s:property:id"]
        }
      ]
    }

    const response = await fetch(
      `${this.baseUrl}/platform/api/v1/query`,
      { 
        headers: this.headers,
        method: 'POST',
        body: JSON.stringify({query: query})
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get database: ${response.statusText}`);
    }

    const data = await response.json()

    const database = data["data"]["objects"][id];
    if (!database) {
      throw new Error(`Database not found by id ${databaseId}`);
    }

    function convertDatabaseRecordName(name?: any): string | undefined {
      if (!name) {
        return undefined
      }
  
      function capitalize(str?: string): string | undefined {
        return str ? str.charAt(0).toUpperCase() + str.slice(1) : undefined
      }
  
      return name.customNames?.singular ?? capitalize(name.name?.toString().substring(3))
    }

    const dataItems = database["s:reference:dataItems"]

    return {
      databaseId: databaseId,
      title: database["s:property:name"],
      rootFolderId: convertId(database["s:property:rootId"]),
      databaseRecordName: convertDatabaseRecordName(database["s:property:listItemsTypeName"]),
      recordCount: dataItems?.length ?? 0
    }
  }

  async getDatabaseField(databaseId: string, fieldId: string): Promise<any> {
    if (!databaseId || !fieldId) {
      throw new Error("DatabaseId and fieldId required");
    }

    const response = await fetch(
      `${this.baseUrl}/public/api/v1/databases/${databaseId}/fields/${fieldId}`,
      { headers: this.headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to list database fields: ${response.statusText}`);
    }

    return response.json()
  }

  async listDatabaseFields(databaseId: string, params: { fieldIds?: string[], limit?: number, nextPageToken?: string}): Promise<any> {
    if (!databaseId) {
      throw new Error("DatabaseId required");
    }

    const queryParams = new URLSearchParams();
    if (params.fieldIds) queryParams.append("fieldIds", params.fieldIds.join(","));
    if (params.limit) queryParams.append("limit", params.limit.toString())
    if (params.nextPageToken) queryParams.append("nextPageToken", params.nextPageToken);

    const response = await fetch(
      `${this.baseUrl}/public/api/v1/databases/${databaseId}/fields?${queryParams}`,
      { headers: this.headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to list database fields: ${response.statusText}`);
    }

    return response.json()
  }

  async listDatabaseRecords(databaseId: string, params: { fieldIds?: string[], filter?: string, searchQuery?: string, limit?: number, nextPageToken?: string }): Promise<any> {
    if (!databaseId) {
      throw new Error("DatabaseId required");
    }

    const queryParams = new URLSearchParams();
    const limit: number = params.limit ?? 100

    queryParams.append("limit", limit.toString())

    if (params.fieldIds) queryParams.append("fieldIds", params.fieldIds.join(","));
    if (params.filter) queryParams.append("filter", params.filter);
    if (params.searchQuery) queryParams.append("searchQuery", params.searchQuery);
    if (params.nextPageToken) queryParams.append("nextPageToken", params.nextPageToken);

    const response = await fetch(
      `${this.baseUrl}/public/api/v1/databases/${databaseId}/records?${queryParams}`,
      { headers: this.headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to list database records: ${response.statusText}`);
    }

    return response.json()
  }

  async createDatabase(
    params: {
      parentFolderId: string,
      title: string,
      databaseRecordName?: string;
      fields?: Array<{
        title: string;
        type: string;
        config?: any;
      }>;
  }): Promise<any> {
    // Create database
    const dbResponse = await fetch(
      `${this.baseUrl}/public/api/v1/databases`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          title: params.title,
          parentFolderId: params.parentFolderId,
          databaseRecordName: params.databaseRecordName,
          requestId: crypto.randomUUID(),
        }),
      }
    );

    if (!dbResponse.ok) {
      throw new Error(`Failed to create database: ${dbResponse.statusText}`);
    }

    const dbResult = await dbResponse.json();

    // Create fields if specified
    const fields = [];
    if (params.fields?.length) {
      for (const field of params.fields) {
        const fieldResponse = await fetch(
          `${this.baseUrl}/public/api/v1/databases/${dbResult.id}/fields`,
          {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify({
              ...field,
              ...field.config,
              requestId: crypto.randomUUID(),
            }),
          }
        );

        if (!fieldResponse.ok) {
          throw new Error(`Failed to create field ${field.title}: ${fieldResponse.statusText}`);
        }

        fields.push(await fieldResponse.json());
      }
    }

    return {
      database: dbResult,
      fields,
    };
  }

  async updateDatabase(databaseId: string, params: {
    title?: string;
    parentFolderId?: string;
    databaseRecordName?: string;
  }): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/public/api/v1/databases/${databaseId}`,
      {
        method: "PATCH",
        headers: this.headers,
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update database: ${response.statusText}`);
    }

    return response.json()
  }

  async deleteDatabase(databaseId: string): Promise<any> {
    if (!databaseId) {
      throw new Error("DatabaseId required")
    }

    const response = await fetch(
      `${this.baseUrl}/public/api/v1/databases/${databaseId}`,
      {
        method: "DELETE",
        headers: this.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete database: ${response.statusText}`);
    }

    return { success: true };
  }

  async createDatabaseField(databaseId: string, params: {
    title: string;
    type: string;
    config?: any;
  }): Promise<any> {
    if (!databaseId || !params.title || !params.type) {
      throw new Error("Some of mandatory parameters are not provided");
    }

    const response = await fetch(
      `${this.baseUrl}/public/api/v1/databases/${databaseId}/fields`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          ...params,
          ...params.config,
          requestId: crypto.randomUUID(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create field: ${response.statusText}`);
    }

    return response.json();
  }

  async updateDatabaseField(databaseId: string, fieldId: string, params: {
    title?: string;
    type: string;
    config?: any;
  }): Promise<any> {
    if (!databaseId || !fieldId || !params.type) {
      throw new Error("Some of mandatory parameters are not provided");
    }

    const response = await fetch(
      `${this.baseUrl}/public/api/v1/databases/${databaseId}/fields/${fieldId}`,
      {
        method: "PATCH",
        headers: this.headers,
        body: JSON.stringify({
          ...params,
          ...params.config
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update field: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteDatabaseField(databaseId: string, fieldId: string): Promise<any> {
    if (!databaseId || !fieldId) {
      throw new Error("DatabaseId and FieldId are required");
    }

    const response = await fetch(
      `${this.baseUrl}/public/api/v1/databases/${databaseId}/fields/${fieldId}`,
      {
        method: "DELETE",
        headers: this.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete field: ${response.statusText}`);
    }

    return { success: true };
  }

  async createDatabaseRecords(databaseId: string, records: Array<{
    title: string;
    fieldValues: Record<string, any>;
  }>): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/public/api/v1/databases/${databaseId}/records`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          requestId: crypto.randomUUID(),
          data: records,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create records: ${response.statusText}`);
    }

    return response.json()
    .then(resp => resp.data)
  }

  async updateDatabaseRecord(databaseId: string, recordId: string, params: {
    title?: string;
    fieldValues?: Record<string, any>;
  }): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/public/api/v1/databases/${databaseId}/records/${recordId}`,
      {
        method: "PATCH",
        headers: this.headers,
        body: JSON.stringify({
          ...params,
          fieldValues: params.fieldValues || {},
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update record: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteRecord(databaseId: string, recordId: string): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.append("recordIds", recordId)

    const response = await fetch(
      `${this.baseUrl}/public/api/v1/databases/${databaseId}/records?${queryParams}`,
      {
        method: "DELETE",
        headers: this.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete record: ${response.statusText}`);
    }

    return { success: true };
  }

}

type RootQuery = Query & {
    objectTypeId: string,
    rootObjectIds: string[],
    recursiveReference?: string
}

type Query = {
    properties?: string[]
    references?: ({id: string} & Query)[],
    filters?: Filter[]
}

type Filter = {
  propertyId: string,
  operatorId: "s:comp_optor:anyOf" | "s:comp_optor:equals" | "s:comp_optor:stringContains",
  value: any
}

function convertId(id: string): string {
  // w2:mod:\d+ => FO\d+
  if (/^w2:mod:\d+$/.test(id)) {
    return id.replace("w2:mod:", 'FO');
  }
  // FO\d+ => w2:mod:\d+
  if (/^FO\d+$/.test(id)) {
    return id.replace("FO", 'w2:mod:');
  }
  // otherwise, return as-is
  return id;
}