curl -X POST http://localhost:8080/api/v1/social-posts \
  -H "Content-Type: application/json" \
  -d '{
    "idea": "Announce our new AI-powered analytics dashboard that identifies revenue drivers for SMBs.",
    "audience": "Startup founders and growth leads",
    "tone": "confident, helpful",
    "platforms": ["linkedin","twitter","facebook","instagram"],
    "timeout_seconds": 90
  }'