# Nansen Portfolio Analytics API

This API endpoint integrates with Nansen's blockchain analytics platform to fetch and analyze cryptocurrency portfolio data, with a specific focus on MOCA token analytics for credential issuance.

## Overview

The `/api/user/user-data` endpoint serves as a comprehensive portfolio analysis service that:

1. **Fetches current token balances** from Nansen API
2. **Retrieves historical MOCA token data** over the last 30 days  
3. **Calculates portfolio metrics** including total value and token counts
4. **Computes historical MOCA averages** using hourly data aggregation
5. **Returns formatted data** for credential issuance

## Architecture

### Core Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend UI   │───▶│   API Route      │───▶│  Nansen APIs    │
│  IssuanceModal  │    │  /user/user-data │    │ Current/Histor. │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Formatted Data  │◀───│ Data Processing  │◀───│  Raw API Data   │
│ with Thousands  │    │ & Calculations   │    │   Pagination    │
│ Separators      │    └──────────────────┘    └─────────────────┘
└─────────────────┘
```

## API Integration Details

### 1. Current Balance Endpoint

**Purpose**: Fetches all current token holdings for a wallet address

```typescript
POST https://api.nansen.ai/api/v1/profiler/address/current-balance
```

**Request Structure**:
```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "chain": "ethereum", 
  "hide_spam_token": true,
  "pagination": {
    "page": 1,
    "per_page": 200
  }
}
```

**Response Processing**:
- ✅ Handles pagination automatically (up to 100 pages safety limit)
- ✅ Aggregates all tokens across all pages
- ✅ Calculates total portfolio USD value
- ✅ Extracts current MOCA token amount

### 2. Historical Balance Endpoint

**Purpose**: Fetches historical MOCA token balances over time periods

```typescript
POST https://api.nansen.ai/api/v1/profiler/address/historical-balances
```

**Request Structure**:
```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "chain": "ethereum",
  "date": {
    "from": "2025-09-01T00:00:00Z",
    "to": "2025-09-07T23:59:59Z"
  },
  "filters": {
    "token_symbol": "MOCA"
  },
  "pagination": {
    "page": 1,
    "per_page": 200
  }
}
```

**Key Features**:
- ✅ **Server-side filtering** for MOCA tokens only (efficiency optimization)
- ✅ **Interval splitting** (30 days → 7-day chunks) to handle API limits
- ✅ **Full pagination** support for each interval
- ✅ **Hourly data aggregation** for accurate averages

## Data Processing Logic

### Current Portfolio Metrics

```typescript
// Calculated from current balance data
{
  totalValueUsd: number,      // Sum of all token USD values
  tokenCount: number,         // Total number of different tokens
  mocaTokenAmount: number     // Current MOCA token balance
}
```

### Historical MOCA Analysis

The historical analysis uses a **hourly averaging system**:

1. **Date Range Splitting**: 30 days split into configurable intervals (default: 7 days)
2. **Hourly Grouping**: Raw data grouped by hour (`YYYY-MM-DD HH:00:00`)
3. **Average Calculation**: Mean MOCA balance across all hours with data

```typescript
// Process flow:
Raw MOCA Data → Group by Hour → Calculate Hour Totals → Average All Hours
```

**Example**:
```
Day 1: 10AM (100 MOCA), 2PM (150 MOCA), 6PM (120 MOCA)
Day 2: 9AM (130 MOCA), 1PM (140 MOCA), 8PM (110 MOCA)
...
Historical Average = (100+150+120+130+140+110+...) / total_hours
```

## Configuration Options

### Adjustable Settings

```typescript
const CONFIG = {
  // Pagination
  CURRENT_BALANCE_PER_PAGE: 200,    // Items per page for current balance
  HISTORICAL_PER_PAGE: 200,         // Items per page for historical data
  
  // Safety Limits
  MAX_PAGES_SAFETY_LIMIT: 100,      // Max pages for current balance
  MAX_INTERVAL_PAGES_LIMIT: 50,     // Max pages per historical interval
  
  // Date Ranges
  TOTAL_DAYS: 30,                   // Historical period length
  INTERVAL_DAYS: 7,                 // Size of each API call interval
  
  // Filtering
  TARGET_TOKEN_SYMBOL: "MOCA",      // Token to analyze historically
  CHAIN: "all",                     // Blockchain network ("ethereum" or "all")
  
  // Test Configuration (easily switched for test builds)
  TEST_ADDRESS: null,               // Set to wallet address for testing
  // Example: TEST_ADDRESS: "0x28c6c06298d514db089934071355e5743bf21d60",
};
```

### Interval Configuration Examples

```typescript
// Daily intervals (maximum granularity, 30 API calls)
INTERVAL_DAYS: 1

// Weekly intervals (current default, 5 API calls)  
INTERVAL_DAYS: 7

// Bi-weekly intervals (faster, 3 API calls)
INTERVAL_DAYS: 14

// Single call (test API limits, 1 API call)
INTERVAL_DAYS: 30
```

## Response Schema

### Final API Response

```typescript
{
  jwt: string,                           // Signed JWT for credential issuance
  response: {
    address: string,                     // Wallet address analyzed
    is_test_address: boolean,            // Whether using test address override
    total_balance_USD: number,           // Total portfolio value (rounded to 2 decimals)
    token_count: number,                 // Number of different tokens
    moca_token_amount: number,           // Current MOCA balance (rounded to 2 decimals)
    historical_avg_moca_balance: number  // 30-day hourly average MOCA (rounded to 2 decimals)
  }
}
```

## Frontend Integration

### Data Display

The frontend automatically formats all numeric values with thousand separators:

- **USD Values**: `$1,234,567.89` (currency formatting)
- **Token Amounts**: `123,456.78` (number formatting with decimals)
- **Counts**: `42` (integer formatting)

### Test Mode Indicators

When `CONFIG.TEST_ADDRESS` is set in the code:
- ✅ Address label changes to **"Test Address"**
- ✅ Orange color styling (`text-orange-600 font-semibold`)

**To enable test mode**: Set `TEST_ADDRESS` in the CONFIG object:
```typescript
const CONFIG = {
  // ... other settings
  TEST_ADDRESS: "0x28c6c06298d514db089934071355e5743bf21d60", // Test mode
  // TEST_ADDRESS: null, // Production mode
};
```

## Error Handling

### Robust Error Management

1. **Authentication Errors**: JWT validation failures return 401
2. **API Failures**: Individual page/interval failures logged but don't stop processing
3. **Data Validation**: Invalid timestamps and malformed data are filtered out
4. **Safety Limits**: Pagination limits prevent infinite loops
5. **Graceful Degradation**: Partial data collection continues even if some calls fail

### Logging Strategy

The system uses emoji-enhanced logging for easy debugging:

```
🚀 Starting Nansen data fetch process...
📄 Fetching current balances page 1...
✅ Page 1: 200 tokens added
📅 === Fetching Interval 1 (2025-09-14 to 2025-09-20) ===
🧮 Calculating current portfolio metrics...
📊 === FINAL METRICS ===
✅ Nansen data processing complete!
```

## Environment Variables

```bash
# Required
NEXT_PRIVATE_NANSEN_API_KEY=your_nansen_api_key_here
```

**Note**: Test addresses are now configured directly in the code via `CONFIG.TEST_ADDRESS` for easier test build switching.

## Performance Considerations

### Optimization Strategies

1. **Server-side Filtering**: MOCA filter applied at API level reduces data transfer
2. **Parallel Processing**: Multiple intervals could be fetched concurrently (future enhancement)
3. **Caching**: React Query provides 5-minute cache on frontend
4. **Pagination Limits**: Configurable safety limits prevent runaway API calls
5. **Efficient Aggregation**: In-memory processing using Maps for O(1) lookups

### Typical Performance

- **Current Balance**: 1-3 API calls (depending on portfolio size)
- **Historical Data**: 5 API calls (7-day intervals over 30 days)
- **Processing Time**: 2-5 seconds for complete analysis
- **Data Transfer**: ~50KB for typical portfolios (MOCA filtering reduces this significantly)

## Future Enhancements

### Potential Improvements

1. **Parallel Historical Fetching**: Fetch all intervals simultaneously
2. **Multiple Token Analysis**: Extend beyond MOCA to other tokens
3. **Advanced Metrics**: Volatility analysis, trend detection
4. **Caching Layer**: Redis/database caching for expensive calculations
5. **Real-time Updates**: WebSocket integration for live data
6. **Custom Date Ranges**: User-configurable analysis periods

## Troubleshooting

### Common Issues

1. **"No MOCA data found"**: Check if wallet actually holds/held MOCA tokens
2. **"API rate limiting"**: Adjust `INTERVAL_DAYS` to reduce API calls
3. **"Authentication failed"**: Verify `NEXT_PRIVATE_NANSEN_API_KEY` is correct
4. **"Incomplete data"**: Check console logs for specific API failures
5. **"Exceed limit in respone data"**: Does not return an error when response data exceeds what it can return in historical balance

### Debug Information

Enable detailed logging by checking browser console - all API requests, responses, and calculations are logged with clear emoji indicators for easy identification.

---

*This API serves as the backbone for MOCA token credential issuance, providing comprehensive portfolio analytics through robust Nansen API integration.*
