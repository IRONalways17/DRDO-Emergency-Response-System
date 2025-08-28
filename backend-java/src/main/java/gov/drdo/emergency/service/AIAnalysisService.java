package gov.drdo.emergency.service;

import gov.drdo.emergency.entity.Incident;
import gov.drdo.emergency.repository.IncidentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Service for AI-powered bomb detection and threat analysis using Google Gemini API
 */
@Service
public class AIAnalysisService {
    
    @Value("${gemini.api.key}")
    private String geminiApiKey;
    
    @Value("${gemini.api.model:gemini-1.5-flash}")
    private String geminiModel;
    
    @Value("${ai.confidence.threshold:0.7}")
    private double confidenceThreshold;
    
    @Autowired
    private IncidentRepository incidentRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private WebSocketService webSocketService;
    
    @Autowired
    private RestTemplate restTemplate;
    
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent";
    
    /**
     * Analyze incident asynchronously using AI
     */
    @Async
    public CompletableFuture<Void> analyzeIncidentAsync(Incident incident) {
        try {
            AIAnalysisResult result = performThreatAnalysis(incident);
            updateIncidentWithAIResults(incident, result);
        } catch (Exception e) {
            handleAnalysisError(incident, e);
        }
        return CompletableFuture.completedFuture(null);
    }
    
    /**
     * Perform threat analysis using Google Gemini API
     */
    public AIAnalysisResult performThreatAnalysis(Incident incident) {
        try {
            String prompt = buildAnalysisPrompt(incident);
            Map<String, Object> requestBody = buildGeminiRequest(prompt);
            
            String apiUrl = String.format(GEMINI_API_URL, geminiModel) + "?key=" + geminiApiKey;
            
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(apiUrl, requestBody, Map.class);
            
            return parseGeminiResponse(response);
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to perform AI analysis", e);
        }
    }
    
    /**
     * Analyze image for bomb/explosive detection
     */
    public AIAnalysisResult analyzeImage(String imageBase64, String description) {
        try {
            String prompt = buildImageAnalysisPrompt(description);
            Map<String, Object> requestBody = buildGeminiImageRequest(prompt, imageBase64);
            
            String apiUrl = String.format(GEMINI_API_URL, "gemini-1.5-flash") + "?key=" + geminiApiKey;
            
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(apiUrl, requestBody, Map.class);
            
            return parseGeminiResponse(response);
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to analyze image", e);
        }
    }
    
    /**
     * Analyze text description for threat keywords and context
     */
    public AIAnalysisResult analyzeTextDescription(String description) {
        try {
            String prompt = buildTextAnalysisPrompt(description);
            Map<String, Object> requestBody = buildGeminiRequest(prompt);
            
            String apiUrl = String.format(GEMINI_API_URL, geminiModel) + "?key=" + geminiApiKey;
            
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(apiUrl, requestBody, Map.class);
            
            return parseGeminiResponse(response);
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to analyze text", e);
        }
    }
    
    // Private helper methods
    
    private String buildAnalysisPrompt(Incident incident) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an AI expert in bomb detection and emergency threat analysis for DRDO (Defence Research and Development Organisation) of India.\n\n");
        prompt.append("Analyze the following emergency incident report and provide a comprehensive threat assessment:\n\n");
        
        prompt.append("INCIDENT DETAILS:\n");
        prompt.append("Type: ").append(incident.getType()).append("\n");
        prompt.append("Severity: ").append(incident.getSeverity()).append("\n");
        prompt.append("Title: ").append(incident.getTitle()).append("\n");
        prompt.append("Description: ").append(incident.getDescription()).append("\n");
        
        if (incident.getLocationAddress() != null) {
            prompt.append("Location: ").append(incident.getLocationAddress()).append("\n");
        }
        
        if (incident.getReporterName() != null) {
            prompt.append("Reporter: ").append(incident.getReporterName()).append("\n");
        }
        
        prompt.append("\nANALYSIS REQUIREMENTS:\n");
        prompt.append("1. Threat Level Assessment (0.0 to 1.0 confidence score)\n");
        prompt.append("2. Bomb/Explosive Indicators Analysis\n");
        prompt.append("3. Urgency Classification (IMMEDIATE/HIGH/MEDIUM/LOW)\n");
        prompt.append("4. Safety Recommendations\n");
        prompt.append("5. Emergency Response Protocols\n");
        prompt.append("6. Evacuation Zone Requirements (if applicable)\n");
        prompt.append("7. Specialized Equipment/Personnel Needed\n\n");
        
        prompt.append("Please provide your analysis in the following JSON format:\n");
        prompt.append("{\n");
        prompt.append("  \"confidence_score\": 0.0-1.0,\n");
        prompt.append("  \"threat_level\": \"CRITICAL/HIGH/MEDIUM/LOW\",\n");
        prompt.append("  \"bomb_indicators\": [\"indicator1\", \"indicator2\"],\n");
        prompt.append("  \"analysis_summary\": \"Brief analysis summary\",\n");
        prompt.append("  \"safety_recommendations\": [\"recommendation1\", \"recommendation2\"],\n");
        prompt.append("  \"response_protocols\": [\"protocol1\", \"protocol2\"],\n");
        prompt.append("  \"evacuation_radius\": 0,\n");
        prompt.append("  \"specialized_units\": [\"unit1\", \"unit2\"],\n");
        prompt.append("  \"immediate_actions\": [\"action1\", \"action2\"]\n");
        prompt.append("}\n");
        
        return prompt.toString();
    }
    
    private String buildImageAnalysisPrompt(String description) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an AI expert in visual bomb detection and explosive device identification for DRDO.\n\n");
        prompt.append("Analyze the uploaded image for potential explosive devices, suspicious objects, or bomb-related threats.\n\n");
        
        if (description != null && !description.trim().isEmpty()) {
            prompt.append("Additional Context: ").append(description).append("\n\n");
        }
        
        prompt.append("VISUAL ANALYSIS REQUIREMENTS:\n");
        prompt.append("1. Identify any suspicious objects or potential explosive devices\n");
        prompt.append("2. Assess threat level based on visual indicators\n");
        prompt.append("3. Look for bomb components (wires, timers, packages, etc.)\n");
        prompt.append("4. Evaluate object placement and context\n");
        prompt.append("5. Determine if immediate evacuation is recommended\n\n");
        
        prompt.append("Provide analysis in JSON format with confidence score, threat assessment, and safety recommendations.");
        
        return prompt.toString();
    }
    
    private String buildTextAnalysisPrompt(String description) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Analyze the following text for bomb threats, explosive-related keywords, and emergency indicators:\n\n");
        prompt.append("TEXT TO ANALYZE:\n");
        prompt.append(description);
        prompt.append("\n\nLook for:\n");
        prompt.append("- Bomb/explosive-related terminology\n");
        prompt.append("- Threat language patterns\n");
        prompt.append("- Urgency indicators\n");
        prompt.append("- Location-specific risks\n");
        prompt.append("- Time-sensitive elements\n\n");
        
        prompt.append("Provide threat assessment with confidence score and recommendations in JSON format.");
        
        return prompt.toString();
    }
    
    private Map<String, Object> buildGeminiRequest(String prompt) {
        Map<String, Object> request = new HashMap<>();
        Map<String, Object> content = new HashMap<>();
        Map<String, Object> parts = new HashMap<>();
        
        parts.put("text", prompt);
        content.put("parts", new Object[]{parts});
        request.put("contents", new Object[]{content});
        
        // Add safety settings for sensitive content
        Map<String, Object> safetySettings = new HashMap<>();
        safetySettings.put("category", "HARM_CATEGORY_DANGEROUS_CONTENT");
        safetySettings.put("threshold", "BLOCK_NONE");
        request.put("safetySettings", new Object[]{safetySettings});
        
        return request;
    }
    
    private Map<String, Object> buildGeminiImageRequest(String prompt, String imageBase64) {
        Map<String, Object> request = new HashMap<>();
        Map<String, Object> content = new HashMap<>();
        
        // Text part
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);
        
        // Image part
        Map<String, Object> imagePart = new HashMap<>();
        Map<String, Object> inlineData = new HashMap<>();
        inlineData.put("mimeType", "image/jpeg");
        inlineData.put("data", imageBase64);
        imagePart.put("inline_data", inlineData);
        
        content.put("parts", new Object[]{textPart, imagePart});
        request.put("contents", new Object[]{content});
        
        return request;
    }
    
    @SuppressWarnings("unchecked")
    private AIAnalysisResult parseGeminiResponse(Map<String, Object> response) {
        try {
            if (response.containsKey("candidates")) {
                Object[] candidates = (Object[]) response.get("candidates");
                if (candidates.length > 0) {
                    Map<String, Object> candidate = (Map<String, Object>) candidates[0];
                    Map<String, Object> content = (Map<String, Object>) candidate.get("content");
                    Object[] parts = (Object[]) content.get("parts");
                    
                    if (parts.length > 0) {
                        Map<String, Object> part = (Map<String, Object>) parts[0];
                        String text = (String) part.get("text");
                        
                        return parseAnalysisResult(text);
                    }
                }
            }
            
            // Fallback if parsing fails
            return createFallbackResult();
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Gemini response", e);
        }
    }
    
    private AIAnalysisResult parseAnalysisResult(String analysisText) {
        AIAnalysisResult result = new AIAnalysisResult();
        
        try {
            // Try to extract JSON from the response
            int jsonStart = analysisText.indexOf("{");
            int jsonEnd = analysisText.lastIndexOf("}") + 1;
            
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                String jsonString = analysisText.substring(jsonStart, jsonEnd);
                // Parse JSON manually or use a JSON library
                result = parseJsonAnalysis(jsonString);
            } else {
                // Parse as free text
                result = parseFreeTextAnalysis(analysisText);
            }
            
        } catch (Exception e) {
            result = createFallbackResult();
            result.setAnalysisSummary("AI Analysis completed with parsing errors: " + e.getMessage());
        }
        
        return result;
    }
    
    private AIAnalysisResult parseJsonAnalysis(String jsonString) {
        // Simple JSON parsing for demo - in production use proper JSON library
        AIAnalysisResult result = new AIAnalysisResult();
        
        try {
            if (jsonString.contains("confidence_score")) {
                String score = extractJsonValue(jsonString, "confidence_score");
                result.setConfidenceScore(Double.parseDouble(score.replaceAll("[^0-9.]", "")));
            }
            
            if (jsonString.contains("threat_level")) {
                result.setThreatLevel(extractJsonValue(jsonString, "threat_level"));
            }
            
            if (jsonString.contains("analysis_summary")) {
                result.setAnalysisSummary(extractJsonValue(jsonString, "analysis_summary"));
            }
            
            if (jsonString.contains("safety_recommendations")) {
                result.setSafetyRecommendations(extractJsonValue(jsonString, "safety_recommendations"));
            }
            
        } catch (Exception e) {
            result = createFallbackResult();
        }
        
        return result;
    }
    
    private AIAnalysisResult parseFreeTextAnalysis(String text) {
        AIAnalysisResult result = new AIAnalysisResult();
        
        // Extract confidence score from text
        if (text.toLowerCase().contains("critical") || text.toLowerCase().contains("high threat")) {
            result.setConfidenceScore(0.9);
            result.setThreatLevel("HIGH");
        } else if (text.toLowerCase().contains("medium") || text.toLowerCase().contains("moderate")) {
            result.setConfidenceScore(0.6);
            result.setThreatLevel("MEDIUM");
        } else {
            result.setConfidenceScore(0.3);
            result.setThreatLevel("LOW");
        }
        
        result.setAnalysisSummary(text.length() > 500 ? text.substring(0, 500) + "..." : text);
        result.setSafetyRecommendations("Follow standard emergency protocols based on AI analysis.");
        
        return result;
    }
    
    private String extractJsonValue(String json, String key) {
        int keyIndex = json.indexOf("\"" + key + "\"");
        if (keyIndex < 0) return "";
        
        int colonIndex = json.indexOf(":", keyIndex);
        int valueStart = json.indexOf("\"", colonIndex) + 1;
        int valueEnd = json.indexOf("\"", valueStart);
        
        if (valueStart > 0 && valueEnd > valueStart) {
            return json.substring(valueStart, valueEnd);
        }
        
        return "";
    }
    
    private AIAnalysisResult createFallbackResult() {
        AIAnalysisResult result = new AIAnalysisResult();
        result.setConfidenceScore(0.5);
        result.setThreatLevel("MEDIUM");
        result.setAnalysisSummary("AI analysis completed. Manual review recommended.");
        result.setSafetyRecommendations("Follow standard emergency response protocols.");
        return result;
    }
    
    private void updateIncidentWithAIResults(Incident incident, AIAnalysisResult result) {
        incident.setAiConfidenceScore(result.getConfidenceScore());
        incident.setAiAnalysis(result.getAnalysisSummary());
        incident.setSafetyRecommendations(result.getSafetyRecommendations());
        
        // Auto-escalate if high confidence threat
        if (result.getConfidenceScore() >= confidenceThreshold) {
            incident.setIsCritical(true);
            if (incident.getSeverity() != Incident.SeverityLevel.CRITICAL) {
                incident.setSeverity(Incident.SeverityLevel.HIGH);
            }
        }
        
        incidentRepository.save(incident);
        
        // Send notifications for high-confidence threats
        if (result.getConfidenceScore() >= confidenceThreshold) {
            notificationService.sendHighThreatAlert(incident, result);
        }
        
        // Broadcast AI analysis update
        webSocketService.broadcastAIAnalysisUpdate(incident, result);
    }
    
    private void handleAnalysisError(Incident incident, Exception error) {
        // Log error and update incident with error status
        incident.setAiAnalysis("AI analysis failed: " + error.getMessage());
        incident.setAiConfidenceScore(0.0);
        incidentRepository.save(incident);
        
        // Notify administrators of AI failure
        notificationService.sendAIAnalysisErrorNotification(incident, error);
    }
    
    // Inner class for AI analysis results
    public static class AIAnalysisResult {
        private double confidenceScore;
        private String threatLevel;
        private String analysisSummary;
        private String safetyRecommendations;
        private String responseProtocols;
        private Integer evacuationRadius;
        private String specializedUnits;
        
        // Constructors
        public AIAnalysisResult() {}
        
        // Getters and Setters
        public double getConfidenceScore() { return confidenceScore; }
        public void setConfidenceScore(double confidenceScore) { this.confidenceScore = confidenceScore; }
        
        public String getThreatLevel() { return threatLevel; }
        public void setThreatLevel(String threatLevel) { this.threatLevel = threatLevel; }
        
        public String getAnalysisSummary() { return analysisSummary; }
        public void setAnalysisSummary(String analysisSummary) { this.analysisSummary = analysisSummary; }
        
        public String getSafetyRecommendations() { return safetyRecommendations; }
        public void setSafetyRecommendations(String safetyRecommendations) { this.safetyRecommendations = safetyRecommendations; }
        
        public String getResponseProtocols() { return responseProtocols; }
        public void setResponseProtocols(String responseProtocols) { this.responseProtocols = responseProtocols; }
        
        public Integer getEvacuationRadius() { return evacuationRadius; }
        public void setEvacuationRadius(Integer evacuationRadius) { this.evacuationRadius = evacuationRadius; }
        
        public String getSpecializedUnits() { return specializedUnits; }
        public void setSpecializedUnits(String specializedUnits) { this.specializedUnits = specializedUnits; }
    }
}
