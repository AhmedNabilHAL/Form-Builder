package com.aiagentictask.form_builder_api.controller;

import com.aiagentictask.form_builder_api.dto.AgentResponse;
import com.aiagentictask.form_builder_api.dto.ChatRequest;
import com.aiagentictask.form_builder_api.dto.ChatSessionDto;
import com.aiagentictask.form_builder_api.service.agent.FormAgentService;
import com.aiagentictask.form_builder_api.service.agent.memory.ChatMemoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Chat agent endpoint. On the first message {@code sessionId} is omitted and
 * the
 * server returns a new one to reuse for the rest of the conversation.
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

  private final FormAgentService agentService;
  private final ChatMemoryService memoryService;

  @PostMapping
  public AgentResponse chat(@Valid @RequestBody ChatRequest request) {
    log.info("POST /api/chat (sessionId={})", request.getSessionId());
    return agentService.chat(request.getSessionId(), request.getMessage(), request.getCurrentForm());
  }

  @GetMapping("/{sessionId}")
  public ChatSessionDto history(@PathVariable String sessionId) {
    log.info("GET /api/chat/{}", sessionId);
    return memoryService.getHistory(sessionId);
  }
}
