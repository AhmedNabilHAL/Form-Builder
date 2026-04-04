package com.aiagentictask.form_builder_api.repository;

import java.util.List;
import java.util.Optional;

import com.aiagentictask.form_builder_api.model.SubmissionDocument;
import org.springframework.data.mongodb.repository.MongoRepository;


public interface SubmissionRepository extends MongoRepository<SubmissionDocument, String> {

    List<SubmissionDocument> findByFormIdOrderBySubmittedAtDesc(String formId);

    Optional<SubmissionDocument> findByIdAndFormId(String id, String formId);
}
