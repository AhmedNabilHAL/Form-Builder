package com.aiagentictask.form_builder_api.repository;

import com.aiagentictask.form_builder_api.model.FormDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface FormRepository extends MongoRepository<FormDocument, String> {
}
