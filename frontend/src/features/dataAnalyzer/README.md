# Data Analyzer Agent

A powerful utility agent that allows you to analyze and transform CSV data using natural language instructions. The Data Analyzer Agent integrates with LLM-powered data processing and decentralized storage to provide insights from your data.

## Features

- **Natural Language Instructions**: Describe what analysis you want in plain English
- **CSV Data Processing**: Load and process data from CSV files
- **Data Transformation**: Filter, sort, aggregate, and transform data based on instructions
- **Statistical Analysis**: Generate summaries, find trends, and extract insights
- **Multiple Output Formats**: Export results as CSV or JSON
- **Decentralized Storage**: Save results to Akave decentralized storage
- **Sample Templates**: Pre-built analysis templates for common tasks

## Setup

### 1. Lilypad API Token

The Data Analyzer Agent uses the Lilypad LLM API for data processing. To set it up:

1. Create or open the `.env.local` file in the project root
2. Add your Lilypad API token:
   ```
   LILYPAD_API_TOKEN=your_lilypad_api_token_here
   ```

### 2. Akave Storage (Optional)

If you want to save results to decentralized storage:

1. Make sure the Akave storage service is configured
2. Add the API endpoint to your `.env.local`:
   ```
   NEXT_PUBLIC_AKAVE_API_URL=your_akave_api_endpoint
   ```

## How It Works

### 1. Data Loading

The agent accepts a URL to a CSV file, which will be fetched and parsed for analysis. You can either provide your own CSV URL or select from the sample datasets included in the tool.

### 2. Analysis Instructions

Provide natural language instructions describing what you want to learn from the data. Examples:
- "Summarize this data with statistical information for each column"
- "Filter rows where sales > 1000 and sort by region, then date"
- "Create a pivot table showing total sales by product category and quarter"
- "Identify the top 5 performing products and calculate their growth rate"

### 3. Data Processing

The instructions are sent along with the CSV data to the Lilypad LLM API, which processes the data according to your specifications. The LLM understands data concepts and can perform operations like:
- Filtering and sorting
- Aggregation and grouping
- Statistical calculations
- Finding patterns and trends

### 4. Output and Storage

Results are returned in your chosen format (CSV or JSON) and can be:
- Viewed directly in the interface
- Downloaded to your computer
- Saved to Akave decentralized storage for persistence

## Example Use Cases

1. **Data Summaries**: Generate statistical summaries of datasets
2. **Business Intelligence**: Extract insights and KPIs from sales or marketing data
3. **Data Cleaning**: Fix formatting issues, remove duplicates, fill missing values
4. **Data Preparation**: Transform data into formats suitable for visualization or machine learning
5. **Trend Analysis**: Identify patterns and trends in time-series data

## Tips for Good Results

1. **Be Specific**: Clearly describe the operations you want performed
2. **Mention Column Names**: Reference actual column names from your data
3. **Start Simple**: Begin with basic operations before trying complex transformations
4. **Use Templates**: The provided templates can be customized for your specific needs
5. **Check Results**: Verify the output makes sense for your data

## Components

### 1. `DataAnalyzerAgent.tsx`

The main component that provides comprehensive data analysis features:
- Complete data loading and processing
- Support for larger datasets
- Advanced storage options
- Detailed result displays

### 2. `DataAnalyzerAgentCard.tsx`

A compact sidebar component for quick data analysis:
- Simplified interface
- Sample dataset selection
- Template-based analysis
- Quick result preview and download

## Usage Examples

### Basic Data Summary

```
Analyze this CSV data and provide a summary with:
1. Total number of rows and columns
2. Summary statistics for numerical columns
3. Top 5 values and their counts for categorical columns
4. Any missing data or quality issues detected
```

### Finding Trends

```
Identify key trends in this dataset:
1. Calculate growth rates between time periods
2. Identify seasonal patterns if applicable
3. Find correlations between different columns
4. List the top 3 most significant trends
```

### Business Insights

```
Extract business insights from this data:
1. Calculate key performance indicators
2. Identify top performing segments
3. Find underperforming areas
4. Provide 3 actionable recommendations based on the data
```

### Custom Transformations

```
Transform this dataset by:
1. Normalizing all numeric columns to a 0-1 scale
2. Converting categorical variables to one-hot encoding
3. Creating a new column that calculates profit margin
4. Removing outliers (values more than 3 standard deviations from the mean)
5. Imputing missing values with the column median
``` 