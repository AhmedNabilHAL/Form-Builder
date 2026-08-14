package com.aiagentictask.form_builder_api.configuration;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds {@code app.agent.*} properties for the ReAct chat agent. The context
 * controls (history threshold, recent window) keep the token cost small; the
 * tool iteration cap bounds the reason/act loop.
 */
@ConfigurationProperties(prefix = "app.agent")
@Data
public class AgentProperties {

  /** Model used for the agent loop and summarization. */
  private String model = "gemini-2.5-flash";

  private Float temperature = 0.3f;

  private Integer maxOutputTokens = 1024;

  /** 0 disables model "thinking" to conserve free-tier tokens. */
  private Integer thinkingBudget = 0;

  /**
   * Maximum reason/act iterations before the agent must produce a final answer.
   */
  private int maxToolIterations = 5;

  /**
   * When stored history exceeds this many characters, older turns are summarized.
   */
  private int historyCharThreshold = 2000;

  /** Number of most recent turns kept verbatim after summarization. */
  private int recentMessagesToKeep = 6;

  private Integer summaryMaxTokens = 512;

  /** Hard cap on a single user message length. */
  private int maxUserMessageLength = 4000;
}
