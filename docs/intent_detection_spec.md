# Intent Detection Function Technical Specification

## Overview
The Intent Detection function is a Supabase Edge Function that processes meeting transcriptions to identify and classify user intents within conversations. This function will be triggered after the transcription is completed and stored in the database.

## Technical Architecture

### Function Structure
```typescript
interface IntentDetectionPayload {
  meetingId: string;
  transcriptionText: string;
  participants: string[];
  metadata: {
    duration: number;
    date: string;
  }
}

interface DetectedIntent {
  type: string;          // The classified intent type
  confidence: number;    // Confidence score (0-1)
  segment: {
    text: string;        // The relevant text segment
    timestamp: number;   // Timestamp in the meeting
    speaker: string;     // Speaker identifier
  }
  metadata: {
    context: string[];   // Related context snippets
    entities: string[];  // Named entities involved
  }
}
```

### Database Schema
```sql
create type intent_type as enum (
  'task_assignment',
  'follow_up',
  'decision_made',
  'question_asked',
  'commitment_made',
  'meeting_scheduled'
);

create table meeting_intents (
  id uuid primary key default uuid_generate_v4(),
  meeting_id text references meetings(id),
  intent_type intent_type not null,
  confidence float not null,
  text_segment text not null,
  timestamp integer not null,
  speaker text not null,
  context jsonb,
  entities jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create index idx_meeting_intents_meeting_id on meeting_intents(meeting_id);
create index idx_meeting_intents_type on meeting_intents(intent_type);
```

## Processing Pipeline

1. **Text Segmentation**
   - Split transcription into meaningful conversation segments
   - Maintain speaker attribution and timing information
   - Filter out non-relevant segments (greetings, small talk)

2. **Intent Classification**
   - Use OpenAI's GPT-4 for initial intent classification
   - Apply custom prompt engineering for business context
   - Extract key entities and action items
   - Calculate confidence scores

3. **Context Enhancement**
   - Analyze surrounding conversation context
   - Link related segments
   - Identify dependencies between intents

4. **Storage and Indexing**
   - Store detected intents in Supabase
   - Create efficient indexes for quick retrieval
   - Maintain relationships with original meeting data

## Implementation Details

### OpenAI Prompt Template
```typescript
const INTENT_DETECTION_PROMPT = `
Analyze the following meeting segment and identify any specific intents:
[SEGMENT]

Classify the intent into one of the following categories:
- Task Assignment
- Follow-up Required
- Decision Made
- Question Asked
- Commitment Made
- Meeting Scheduled

For each intent detected:
1. Specify the intent type
2. Extract relevant entities
3. Identify the key action items
4. Determine the level of confidence
5. Note any dependencies or context

Provide the analysis in a structured JSON format.
`;
```

### Error Handling
- Implement retry logic for API calls
- Log failed classifications for manual review
- Handle edge cases (multiple intents, ambiguous statements)
- Maintain transaction integrity with database operations

### Performance Considerations
- Batch process segments for efficient API usage
- Implement caching for frequent patterns
- Use parallel processing where possible
- Monitor and optimize database queries

## Integration Points

1. **Webhook Handler**
   - Receive transcription completed webhook
   - Validate and queue for processing
   - Handle rate limiting and backoff

2. **Meeting Info Function**
   - Extend existing function to include intent data
   - Provide filtered views based on intent types
   - Support aggregated intent statistics

3. **Database**
   - Maintain referential integrity
   - Support efficient querying patterns
   - Enable analytics and reporting

## Security Considerations

1. **Data Privacy**
   - Encrypt sensitive information
   - Implement access controls
   - Log access patterns
   - Handle PII appropriately

2. **API Security**
   - Validate all inputs
   - Implement rate limiting
   - Use secure API keys
   - Monitor for abuse

## Testing Strategy

1. **Unit Tests**
   - Test intent classification logic
   - Validate data transformations
   - Check error handling

2. **Integration Tests**
   - Verify database operations
   - Test API integrations
   - Validate end-to-end flow

3. **Performance Tests**
   - Measure processing latency
   - Test under load
   - Verify scaling capabilities

## Deployment and Monitoring

1. **Deployment**
   - Use Supabase CLI for function deployment
   - Implement blue-green deployment
   - Maintain version control

2. **Monitoring**
   - Track processing times
   - Monitor error rates
   - Alert on anomalies
   - Log key metrics

## Future Enhancements

1. **Machine Learning**
   - Train custom models on historical data
   - Improve classification accuracy
   - Add new intent types

2. **Integration**
   - Connect with task management systems
   - Enable automated follow-ups
   - Support custom workflows

3. **Analytics**
   - Provide intent trends
   - Generate meeting insights
   - Enable custom reporting
