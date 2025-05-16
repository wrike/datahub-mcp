# Wrike Datahub MCP Server 🚀

A [Model Context Protocol](https://github.com/modelcontextprotocol/protocol) server implementation for Wrike Datahub API, enabling LLMs to work with structured data in Wrike databases.

## 🌟 Features

Analyse:
- 📊 Access to Wrike databases, fields, and records

Database Management:
- 📋 List and retrieve database details
- 🆕 Create new databases with custom fields
- ✏️ Update database properties
- 🗑️ Delete databases

Field Management:
- 📊 Define and manage database structure
- 🔄 Update field properties and configurations
- ❌ Remove fields from databases
- 🎨 Support for various field types:
  - Basic: text, number, percent, checkbox
  - Temporal: date, duration
  - Financial: currency
  - Selection: singleSelect, multiSelect
  - Relational: linkToDatabase

Record Operations:
- 📝 Create single or multiple records
- 🔍 Query records with search
- 📈 Update record data and field values
- ❌ Delete individual records

## 🚀 Getting Started

### Prerequisites

- Node.js (v20 or higher)
- pnpm
- Wrike account with API access

### Configuration

Set up your environment variables:
```bash
export WRIKE_TOKEN="your-wrike-api-token"
export WRIKE_HOST="wrike.com"  # optional, defaults to wrike.com
```

This project is using the `dotenv` package, so you can put enviroment variables into `.env` file.

### Building
Install and build the package
```bash
pnpm install && pnpm build
```
Package and install server itself
```bash
npm pack && npm install -g ./wrike-datahub-mcp-1.0.0.tgz
```
Then run it within your MCP client
```bash
@wrike/datahub-mcp
```

### Running the Inspector
To inspect the server's capabilities and test its functionality:
```bash
pnpm inspector
```
Read more: [MCP Inspector](https://github.com/modelcontextprotocol/inspector)

## 🔧 Tools
- `datahub_list_spaces`: List available spaces
- `datahub_list_databases`: List available databases
- `datahub_get_database`: Get database details
- `datahub_list_database_fields`: Get database structure
- `datahub_list_database_records`: Query database records
- `datahub_create_database`: Create a new database with fields
- `datahub_update_database`: Update a database
- `datahub_delete_database`: Delete a database
- `datahub_create_database_field`: Create a database field
- `datahub_update_database_field`: Update a database field
- `datahub_delete_database_field`: Delete a database field
- `datahub_create_database_records`: Create records in a database
- `datahub_update_database_record`: Update an existing database record
- `datahub_delete_database_record`: Delete a database record

## ⚠️ Important Notes
- Respect Wrike API rate limits
- Be mindful of data privacy and security
- Consider data volume when querying large databases

## 🐛 Troubleshooting
If you encounter issues:

- Verify your WRIKE_TOKEN is valid
- Check your network connection
- Ensure you have appropriate permissions in Wrike
- Check the server logs for detailed error messages

## 📚 Documentation
For more detailed information:

- [MCP Protocol Documentation](https://github.com/modelcontextprotocol/protocol)
- [Wrike Datahub API Documentation](https://developers.wrike.com/datahub-overview/)