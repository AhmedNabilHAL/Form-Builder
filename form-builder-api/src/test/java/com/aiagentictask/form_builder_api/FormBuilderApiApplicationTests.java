package com.aiagentictask.form_builder_api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"app.gemini.api-key=test-key",
		"spring.mongodb.uri=mongodb://127.0.0.1:1/form_builder?connectTimeoutMS=100&serverSelectionTimeoutMS=100"
})
class FormBuilderApiApplicationTests {

	@Test
	void contextLoads() {
	}

}
