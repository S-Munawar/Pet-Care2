# Pet Health ML Integration

## Overview
Complete integration of the ML inference service into the Express backend, providing secure, authenticated pet health risk assessment with automatic persistence to MongoDB.

## Architecture

### Separation of Concerns
- **Express Backend**: Authentication, authorization, validation, orchestration, persistence
- **ML Inference Service**: Model inference, preprocessing, safety guardrails
- **MongoDB**: Single source of truth for health records

### Request Flow
1. **Authentication** - Firebase JWT validation
2. **Authorization** - Pet ownership verification
3. **Input Validation** - Health data validation
4. **ML Service Call** - HTTP request to inference service
5. **Persistence** - PetHealthRecord creation
6. **Response** - Sanitized results to client

## API Endpoints

### Health Analysis
```
POST /api/ml-analysis/pet/:petId
Authorization: Bearer <token>
Content-Type: application/json

{
  "symptoms": "vomiting, lethargy",
  "duration": "1-3-days",
  "severity": "moderate",
  "appetite": "decreased",
  "energy": "low",
  "temperature": "38.5",
  "weight": "25.0",
  "age": "2 years",
  "breed": "Labrador Retriever",
  "additionalNotes": "Started after eating new food"
}
```

**Response:**
```json
{
  "message": "Health analysis completed successfully",
  "analysis": {
    "recordId": "507f1f77bcf86cd799439011",
    "riskCategory": "Medium",
    "confidence": 78,
    "flags": {
      "highRisk": false,
      "requiresAttention": true
    },
    "timestamp": "2023-12-19T14:30:22.123Z"
  },
  "safetyNotice": "This is a risk assessment only. Consult a veterinarian for medical advice."
}
```

### ML Service Status
```
GET /api/ml-analysis/status
Authorization: Bearer <token>
```

## Security Features

### Authentication & Authorization
- **Firebase JWT validation** on all requests
- **Pet ownership verification** - users can only analyze their own pets
- **Role-based access** - pet owners and vets can perform analysis

### Input Validation
- **Required field enforcement** (symptoms, pet ownership)
- **Range validation** (temperature: 30-45°C, weight: 0-200kg)
- **Type validation** for all inputs
- **Malformed request rejection**

### Rate Limiting
- **10 requests per 15 minutes** per user
- **In-memory store** with automatic cleanup
- **429 status** with retry-after header

## Data Persistence

### PetHealthRecord Schema
```typescript
{
  petId: ObjectId,           // Reference to pet
  recordType: "ml_analysis", // Fixed type for ML records
  title: string,             // Auto-generated title
  description: string,       // Analysis description
  
  petInfo: {                 // Pet snapshot at analysis time
    name: string,
    species: string,
    breed: string,
    age: string,
    gender: string
  },
  
  mlAnalysis: {              // ML results
    riskLevel: "Low" | "Medium" | "High" | "Critical",
    confidence: number,      // 0-100 percentage
    recommendations: string[],
    possibleConditions: object[],
    inputSymptoms: string[],
    modelVersion: string,
    analysisDate: Date
  },
  
  data: Map<string, any>,    // Input data for audit
  vitals: object,            // Measured vitals
  recordDate: Date           // Analysis timestamp
}
```

### Audit Trail
- **Immutable records** - no updates after creation
- **Complete input capture** - all form data stored
- **Model versioning** - tracks which model version used
- **Timestamp tracking** - analysis and record creation times

## Error Handling

### ML Service Errors
- **Service unavailable** (503) - ML service down
- **Invalid ML response** - graceful degradation
- **Timeout handling** - 10 second timeout
- **Retry logic** - automatic retries for transient failures

### Validation Errors
- **Missing required fields** (400)
- **Invalid ranges** (400) 
- **Pet not found** (404)
- **Access denied** (403)

### Database Errors
- **Connection failures** - proper error responses
- **Validation errors** - schema validation
- **Duplicate prevention** - no partial writes

## Safety Constraints

### No Medical Diagnoses
- **Risk categories only** - Low/Medium/High/Critical
- **No disease names** in responses
- **Safety notices** in all responses
- **Conservative defaults** for missing data

### Output Sanitization
- **Structured responses** only
- **No raw ML probabilities** exposed
- **No internal metadata** leaked
- **Client-safe error messages**

## Monitoring & Observability

### Structured Logging
```typescript
// Request logging
console.log(`Performing ML analysis for pet ${petId} by user ${userId}`);

// Completion logging  
console.log(`Health analysis completed for pet ${petId}, record ${recordId}`);

// Error logging
console.error("ML inference failed:", error.message);
```

### Metrics Tracked
- **Analysis request count** by user
- **ML service latency** and availability
- **Risk category distribution**
- **Error rates** by type

## Configuration

### Environment Variables
```bash
# ML Service Configuration
ML_INFERENCE_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb://localhost:27017/petcare

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com
```

## Deployment

### Service Dependencies
1. **MongoDB** - health record storage
2. **ML Inference Service** - model predictions
3. **Firebase** - authentication

### Health Checks
- **ML service status** endpoint
- **Database connectivity** validation
- **Authentication service** verification

### Scaling Considerations
- **Stateless design** - horizontal scaling ready
- **Rate limiting** - prevents abuse
- **Async processing** - non-blocking ML calls
- **Connection pooling** - efficient resource usage

## Integration Testing

### Test Scenarios
- **Valid analysis request** - complete flow
- **Invalid pet ownership** - access denied
- **ML service unavailable** - graceful degradation
- **Rate limit exceeded** - proper throttling
- **Malformed input** - validation errors

### Test Data
```bash
# Valid request
curl -X POST http://localhost:2000/api/ml-analysis/pet/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"symptoms": "vomiting", "severity": "mild"}'

# Check ML service status
curl http://localhost:2000/api/ml-analysis/status \
  -H "Authorization: Bearer <token>"
```

## Future Enhancements

### Planned Features
- **Batch analysis** for multiple pets
- **Trend analysis** over time
- **Vet review workflow** for high-risk cases
- **Real-time notifications** for critical risks

### Scalability Improvements
- **Redis rate limiting** for distributed systems
- **Message queues** for async processing
- **Caching layer** for frequent requests
- **Load balancing** for ML service calls