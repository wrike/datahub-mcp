import { Tool } from "@modelcontextprotocol/sdk/types.js"
import { DatahubClient } from "./datahub_client.js";

export type DatahubTool = Tool & {
    handler: (params: any, client: DatahubClient) => any | Promise<any>;
}

const listSpacesTool: DatahubTool = {
  name: "datahub_list_spaces",
  description: "List spaces available in the workspace",
  inputSchema: {
    type: "object"
  },
  outputSchema: {
    type: "array",
    items: {
      type: "object",
      properties: {
        rootFolderId: { type: "string" },
        type: {
          type: "string",
          enum: ["Public", "Private"]
        },
        title: { type: "string" }
      },
      required: ["rootFolderId", "type", "title"],
    }
  },
  handler: (_, client) => {
    return client.listSpaces();
  }
};

const listDatabasesTool: DatahubTool = {
  name: "datahub_list_databases",
  description: "List databases available in the workspace. Prefered way to search databases.",
  inputSchema: {
    type: "object",
    properties: {
      rootFolderIds: {
        type: "array",
        items: {
          type: "string",
          pattern: "FO\d+",
          description: "Folder ID acquired from folder"
        },
      },
      nameContains: {
        type: "string",
        description: "Keyword to search databases with specific name"
      }
    }
  },
  outputSchema: {
    type: "array",
    items: {
      type: "object",
      properties: {
        databaseId: { type: "string" },
        title: { type: "string" },
        rootFolderId: { type: "string" }
      },
      required: ["databaseId", "title", "rootFolderId"],
    }
  },
  handler: (params, client) => client.listDatabases(params.parentFolderIds, params.nameContains),
};

const getDatabaseTool: DatahubTool = {
    name: "datahub_get_database",
    description: "Get detailed information about a specific database efficiently including record count",
    inputSchema: {
      type: "object",
      properties: {
        databaseId: {
          type: "string",
          description: "ID of the database to fetch",
          pattern: "DB\d+"
        },
      },
      required: ["databaseId"],
    },
    outputSchema: {
      type: "object",
      properties: {
        id: "string",
        title: "string",
        rootFolderId: "string",
        databaseRecordName: "string",
        recordCount: {
          type: "integer",
          description: "Total amount of records in database"
        }
      },
      required: ["id", "title", "rootFolderId", "recordCount"],
    },
    handler: (params, client) => client.getDatabase(params.databaseId)
  };

  const listDatabaseFieldsTool: DatahubTool = {
    name: "datahub_list_database_fields",
    description: "Get metadata about database fields (columns)",
    inputSchema: {
      type: "object",
      properties: {
        databaseId: {
          type: "string",
          description: "ID of the database",
          pattern: "DB\d+"
        },
        fieldIds: {
          type: "array",
          items: { type: "string" },
          description: "Optional specific field IDs to fetch",
        },
        limit: {
          type: "integer",
          description: "Limit the number of fields to include in the response",
          min: "1",
          max: "1000"
        },
        nextPageToken: {
          type: "string",
          description: "Token provided by response the fetch the next batch of entries"
        }
      },
      required: ["databaseId"],
    },
    outputSchema: {
      type: "object",
      properties: {
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                type: { 
                  type: "string",
                  enum: ['text', 'number', 'percent', 'checkbox', 'date', 'duration', 'currency', 'singleSelect', 'multiSelect', 'linkToDatabase']
                },
                isMirror: { type: "boolean" },
              },
              required: ["id", "title", "type", "isMirror"],
            }
          },
          nextPageToken: {
            type: "string",
            description: "Token to be passed to subsequent request to fetch the next bunch of data. Null means no data left in table"
          }
      },
      required: ["data"],
    },
    handler: (params, client) => client.listDatabaseFields(params.databaseId, params)
  };

  const getDatabaseField: DatahubTool = {
    name: "datahub_get_database_field",
    description: "Get metadata about database field (column)",
    inputSchema: {
      type: "object",
      properties: {
        databaseId: {
          type: "string",
          description: "ID of the database",
          pattern: "DB\d+"
        },
        fieldId: {
          type: "string",
          description: "Field ID to fetch",
        }
      },
      required: ["databaseId", "fieldId"],
    },
    outputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        type: { 
          type: "string",
          enum: ['text', 'number', 'percent', 'checkbox', 'date', 'duration', 'currency', 'singleSelect', 'multiSelect', 'linkToDatabase']
        },
        isMirror: { type: "boolean" },
      },
      required: ["id", "title", "type", "isMirror"]
    },
    handler: (params, client) => client.getDatabaseField(params.databaseId, params.fieldId)
  };

  const listDatabaseRecordsTool: DatahubTool = {
    name: "datahub_list_database_records",
    description: "Fetch records from the database. Always use paging when nextPageToken is provided.",
    inputSchema: {
      type: "object",
      properties: {
        databaseId: {
          type: "string",
          description: "ID of the database",
          pattern: "DB\d+"
        },
        fieldIds: {
          type: "array",
          items: { 
            type: "string",
            pattern: "FI\d+"
          },
          description: "Specific fields to include in the response",
        },
        limit: {
          type: "integer",
          description: "Limit the number of records to include in the response",
          min: "1",
          max: "1000"
        },
        searchQuery: {
          type: "string",
          description: "FullTextSearch query to search across the records"
        },
        nextPageToken: {
          type: "string",
          description: "Paging token provided by response the fetch the next batch of entries"
        }
      },
      required: ["databaseId"],
    },
    outputSchema: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              fieldValues: {
                type: "object",
                additionalProperties: true,
                default: {}
              },
            },
            required: ["id", "title", "fieldValues"],
          },
        },
        nextPageToken: {
          type: "string",
          description: "Paging token to be passed to subsequent request to fetch the next bunch of data. Null means no data left in table"
        }
      },
      required: ["data"]
    },
    handler: (params, client) => client.listDatabaseRecords(params.databaseId, params)
  };

  const createDatabaseTool: DatahubTool = {
    name: "datahub_create_database",
    description: "Create a new database with specified fields",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title of the new database",
        },
        parentFolderId: {
          type: "string",
          description: "ID of the parent folder where to create the database",
          pattern: "FO\d+"
        },
        databaseRecordName: {
          type: "string",
          description: "Optional name template for database records",
        },
        fields: {
          type: "array",
          description: "Fields to create in the database",
          items: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Field name",
              },
              type: {
                type: "string",
                enum: ['text', 'number', 'percent', 'checkbox', 'date', 'duration', 'currency', 'singleSelect', 'multiSelect', 'linkToDatabase', 'formula'],
                description: "Field type",
              },
              config: {
                type: "object",
                description: "Type-specific configuration",
                properties: {
                  allowedEnumValues: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        color: { type: "string" },
                      },
                      required: ["name"],
                    },
                  },
                  databaseId: { type: "string" },
                  allowMultipleEntries: { type: "boolean" },
                  mirrorFields: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        fieldId: { type: "string" },
                      },
                      required: ["title", "fieldId"],
                    },
                  },
                  formula: {
                    type: "string",
                    description: `Formula for formula fields. Formula fields are calculated readonly fields.
                    Formula definition rules:
                    - Formulas support base operators: *-/+()
                    - Formula operand must be a reference to field in a same database (id DB\d+) or a numeric constant
                    - Formulas does not support a certain operations, such as: DATE * DATE, DATE / DATE, etc. In case on any failure, check the error message provided by client.
                    - Use the '$today' syntax to represent the 'today' date
                    `
                  },
                  format: {
                    type: "string",
                    description: "Result field format for formula fields",
                    enum: ["number", "currency", "percent", "hours", "days", "date"]
                  },
                },
              },
            },
            required: ["title", "type"],
          },
        },
      },
      required: ["title", "parentFolderId"],
    },
    outputSchema: {
      type: "object",
      properties: {
        database: {
          type: "object",
          properties: {
            id: "string",
            rootFolderId: "string",
            title: "string"
          },
          required: ["id", "rootFolderId", "title"]
        },
        fields: {
          type: "array",
          items: { 
            type: "object",
            properties: {
              id: "string",
              title: "string",
              type: {
                type: "string",
                enum: ['text', 'number', 'percent', 'checkbox', 'date', 'duration', 'currency', 'singleSelect', 'multiSelect', 'linkToDatabase', 'formula']
              }
            },
            required: ["id", "title", "type"]
          },
        },
      },
      required: ["database", "fields"],
    },
    handler: (params, client) => client.createDatabase(params)
};

  const updateDatabaseTool: DatahubTool = {
    name: "datahub_update_database",
    description: "Update database properties",
    inputSchema: {
      type: "object",
      properties: {
        databaseId: {
          type: "string",
          description: "ID of the database to update",
          pattern: "DB\d+"
        },
        title: {
          type: "string",
          description: "New title for the database",
        },
        parentFolderId: {
          type: "string",
          description: "New parent folder ID",
          pattern: "FO\d+"
        },
        databaseRecordName: {
          type: "string",
          description: "New template for database records",
        },
      },
      required: ["databaseId"],
    },
    outputSchema: {
      type: "object",
      properties: {
        id: "string",
        title: "string",
        parentFolderId: "string",
        databaseRecordName: "string",
      },
      required: ["id", "title"],
    },
    handler: (params, client) => client.updateDatabase(params.databaseId, params)
  };

  const deleteDatabaseTool: DatahubTool = {
    name: "datahub_delete_database",
    description: "Delete an existing database and all its contents",
    inputSchema: {
      type: "object",
      properties: {
        databaseId: {
          type: "string",
          description: "ID of the database to delete",
          pattern: "DB\d+"
        },
      },
      required: ["databaseId"],
    },
    outputSchema: {
      type: "object",
      properties: {
        success: {
          type: "boolean",
          description: "Whether the deletion was successful",
        },
      },
      required: ["success"],
    },
    handler: (params, client) => client.deleteDatabase(params.databaseId)
  };

  const createDatabaseFieldTool: DatahubTool = {
    name: "datahub_create_database_field",
    description: "Create a new field in an existing database",
    inputSchema: {
      type: "object",
      properties: {
        databaseId: {
          type: "string",
          description: "ID of the database",
          pattern: "DB\d+"
        },
        title: {
          type: "string",
          description: "Name of the field",
        },
        type: {
          type: "string",
          enum: ['text', 'number', 'percent', 'checkbox', 'date', 'duration', 'currency', 'singleSelect', 'multiSelect', 'linkToDatabase', 'formula'],
          description: "Type of the field",
        },
        config: {
          type: "object",
          description: "Field type-specific configuration",
          properties: {
            allowedEnumValues: {
              type: "array",
              description: "Options for singleSelect/multiSelect fields",
              items: {
                type: "object",
                properties: {
                  name: { 
                    type: "string",
                    description: "Option name",
                  },
                  color: { 
                    type: "string",
                    enum: ["Brown", "Red", "Purple", "Indigo", "DarkBlue", "Blue", "Turquoise", "DarkCyan", "Green", "YellowGreen", "Yellow", "Orange", "Gray", "DarkRed"],
                    description: "Option color (for select fields)",
                  },
                },
                required: ["name"],
              },
            },
            databaseId: {
              type: "string",
              description: "Target database ID for linkToDatabase fields",
            },
            allowMultipleEntries: {
              type: "boolean",
              description: "Allow multiple links for linkToDatabase fields",
            },
            mirrorFields: {
              type: "array",
              description: "Mirror field configurations for linkToDatabase fields",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  fieldId: { type: "string" },
                },
                required: ["title", "fieldId"],
              },
            },
            formula: {
              type: "string",
              description: `Formula for formula fields. Formula fields are calculated readonly fields.
              Formula definition rules:
              - Formulas support base operators: *-/+()
              - Formula operand must be a reference to field in a same database (id DB\d+) or a numeric constant
              - Formulas does not support a certain operations, such as: DATE * DATE, DATE / DATE, etc. In case on any failure, check the error message provided by client.
              - Use the '$today' syntax to represent the 'today' date
              `
            },
            format: {
              type: "string",
              description: "Result field format for formula fields",
              enum: ["number", "currency", "percent", "hours", "days", "date"]
            }
          },
        },
      },
      required: ["databaseId", "title", "type"],
    },
    outputSchema: {
      type: "object",
      properties: {
        type: "object",
        properties: {
          id: "string",
          title: "string",
          type: {
            type: "string",
            enum: ['text', 'number', 'percent', 'checkbox', 'date', 'duration', 'currency', 'singleSelect', 'multiSelect', 'linkToDatabase', 'formula']
          }
        },
        required: ["id", "title", "type"]
      },
    },
    handler: (params, client) => client.createDatabaseField(params.databaseId, params)
  };

  const updateDatabaseFieldTool: DatahubTool = {
    name: "datahub_update_database_field",
    description: "Update a field in a database",
    inputSchema: {
      type: "object",
      properties: {
        databaseId: {
          type: "string",
          description: "ID of the database",
          pattern: "DB\d+"
        },
        fieldId: {
          type: "string",
          description: "ID of the field to update",
          pattern: "FI\d+"
        },
        title: {
          type: "string",
          description: "New title for the field",
        },
        type: {
          type: "string",
          enum: ['text', 'number', 'percent', 'checkbox', 'date', 'duration', 'currency', 'singleSelect', 'multiSelect', 'linkToDatabase', 'formula'],
          description: "Type of the field. This field is mandatory, if not given explicitly - take the value from existing field",
        },
        config: {
          type: "object",
          description: "Field type-specific configuration updates",
          properties: {
            allowedEnumValues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  color: { type: "string" },
                },
                required: ["name"],
              },
            },
            mirrorFieldsAdd: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  fieldId: { type: "string" },
                },
                required: ["title", "fieldId"],
              },
            },
            mirrorFieldsRemove: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  wrikeFieldId: { type: "string" },
                },
                required: ["wrikeFieldId"],
              }
            },
            formula: {
              type: "string",
              description: `Formula for formula fields. Formula fields are calculated readonly fields.
              Formula definition rules:
              - Formulas support base operators: *-/+()
              - Formula operand must be a reference to field in a same database (id DB\d+) or a numeric constant
              - Formulas does not support a certain operations, such as: DATE * DATE, DATE / DATE, etc. In case on any failure, check the error message provided by client.
              - Use the '$today' syntax to represent the 'today' date
              `
            },
            format: {
              type: "string",
              description: "Result field format for formula fields",
              enum: ["number", "currency", "percent", "hours", "days", "date"]
            }
          },
        },
      },
      required: ["databaseId", "fieldId", "type"],
    },
    outputSchema: {
      type: "object",
      properties: {
        id: "string",
        title: "string",
        type: {
          type: "string",
          enum: ['text', 'number', 'percent', 'checkbox', 'date', 'duration', 'currency', 'singleSelect', 'multiSelect', 'linkToDatabase', 'formula']
        }
      },
      required: ["id", "title", "type"]
    },
    handler: (params, client) => client.updateDatabaseField(params.databaseId, params.fieldId, params)
  };

  const deleteDatabaseFieldTool: DatahubTool = {
    name: "datahub_delete_database_field",
    description: "Delete a field from a database",
    inputSchema: {
      type: "object",
      properties: {
        databaseId: {
          type: "string",
          description: "ID of the database",
          pattern: "DB\d+"
        },
        fieldId: {
          type: "string",
          description: "ID of the field to delete",
          pattern: "FI\d+"
        },
      },
      required: ["databaseId", "fieldId"],
    },
    outputSchema: {
      type: "object",
      properties: {
        success: {
          type: "boolean",
          description: "Whether the deletion was successful",
        },
      },
      required: ["success"],
    },
    handler: (params, client) => client.deleteDatabaseField(params.databaseId, params.fieldId)
  };

  const createDatabaseRecordsTool: DatahubTool = {
    name: "datahub_create_database_records",
    description: "Create one or more records in a database",
    inputSchema: {
      type: "object",
      properties: {
        databaseId: {
          type: "string",
          description: "ID of the database",
          pattern: "DB\d+"
        },
        records: {
          type: "array",
          description: "Records to create",
          items: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Record title",
              },
              fields: {
                type: "array",
                description: "Field values for the record",
                items: {
                  type: "object",
                  properties: {
                    fieldId: {
                      type: "string",
                      description: "ID of the field",
                    },
                    value: {
                      type: "string",
                      description: `Value for the field.
                      Allowed values format:
                      - number, currency, percent: any number
                      - text: any text
                      - singleSelect, multipleSelect: enum values
                      - checkbox: boolean
                      - duration: duration in limited ISO 8601 format, only PT prefix supported
                      - date: date in ISO 8601 format
                      - linkToDatabase: array of record ids ("RE\d+")
                      `,
                    },
                  },
                  required: ["fieldId", "value"]
                }
              },
            },
            required: ["title"],
          },
        },
      },
      required: ["databaseId", "records"],
    },
    outputSchema: {
      type: "object",
      properties: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: "string",
            title: {
              type: "string",
              description: "Record title",
            },
            fieldValues: {
              type: "object",
              description: "Values for fields (key is field ID)",
              additionalProperties: true,
            }
          },
          required: ["id", "title", "fieldValues"],
        },
      }
    },
    handler: (params, client) => {
      const records = params.records.map((record: { title: string; fields: {fieldId: string, value: string}[]; }) => ({
          title: record.title,
          fieldValues: record.fields?.reduce((acc: any, field) => ({
            ...acc,
            [field.fieldId]: field.value,
          }), {}) || {},
      }));

      return client.createDatabaseRecords(
          params.databaseId,
          records
      )
    }
  };

  const updateDatabaseRecordTool: DatahubTool = {
    name: "datahub_update_database_record",
    description: "Update an existing record in a database",
    inputSchema: {
      type: "object",
      properties: {
        databaseId: {
          type: "string",
          description: "ID of the database",
          pattern: "DB\d+"
        },
        recordId: {
          type: "string",
          description: "ID of the record to update",
          pattern: "RE\d+"
        },
        title: {
          type: "string",
          description: "New title for the record",
        },
        fields: {
          type: "array",
          description: "New field values for the record",
          items: {
            type: "object",
            properties: {
              fieldId: {
                type: "string",
                description: "ID of the field",
              },
              value: {
                type: "string",
                description: `New value for the field.
                Allowed values format:
                - number, currency, percent: any number
                - text: any text
                - singleSelect, multipleSelect: enum values
                - checkbox: boolean
                - duration: duration in limited ISO 8601 format, only PT prefix supported
                - date: date in ISO 8601 format
                - linkToDatabase: array of record ids ("RE\d+")
                `,
              },
            },
            required: ["fieldId", "value"],
          },
          default: [],
        },
      },
      required: ["databaseId", "recordId"],
    },
    outputSchema: {
      type: "object",
      properties: {
        type: "object",
        properties: {
          id: "string",
          title: {
            type: "string",
            description: "Record title",
          },
          fieldValues: {
            type: "object",
            description: "Values for fields (key is field ID)",
            additionalProperties: true,
          },
        },
        required: ["id", "title", "fieldValues"],
      }
    },
    handler: (params, client) => {
        const fieldValues = params.fields?.reduce((acc: any, field: { fieldId: string; value: string; }) => ({
          ...acc,
          [field.fieldId]: field.value,
        }), {}) || {};

        return client.updateDatabaseRecord(
          params.databaseId,
          params.recordId,
          {
            title: params.title,
            fieldValues: fieldValues,
          }
        );
    }
  };

  const deleteRecordTool: DatahubTool = {
    name: "datahub_delete_database_record",
    description: "Delete an existing record from a database",
    inputSchema: {
      type: "object",
      properties: {
        databaseId: {
          type: "string",
          description: "ID of the database",
          pattern: "DB\d+"
        },
        recordId: {
          type: "string",
          description: "ID of the record to delete",
          pattern: "RE\d+"
        },
      },
      required: ["databaseId", "recordId"],
    },
    outputSchema: {
      type: "object",
      properties: {
        success: {
          type: "boolean",
          description: "Whether the deletion was successful",
        },
      },
      required: ["success"],
    },
    handler: (params, client) => client.deleteRecord(params.databaseId, params.recordId)
  };

export const tools: DatahubTool[] = [
    listSpacesTool,

    listDatabasesTool,
    getDatabaseTool,
    listDatabaseFieldsTool,
    listDatabaseRecordsTool,

    createDatabaseTool,
    updateDatabaseTool,
    deleteDatabaseTool,

    getDatabaseField,
    createDatabaseFieldTool,
    updateDatabaseFieldTool,
    deleteDatabaseFieldTool,

    createDatabaseRecordsTool,
    updateDatabaseRecordTool,
    deleteRecordTool,
]