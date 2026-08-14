package com.aiagentictask.form_builder_api.repository;

import com.aiagentictask.form_builder_api.model.ChatSessionDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ChatSessionRepository extends MongoRepository<ChatSessionDocument, String> {
}
