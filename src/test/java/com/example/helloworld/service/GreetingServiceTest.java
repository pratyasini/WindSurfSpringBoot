package com.example.helloworld.service;

import com.example.helloworld.model.Greeting;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class GreetingServiceTest {

    private GreetingService greetingService;

    @BeforeEach
    void setUp() {
        greetingService = new GreetingService();
    }

    @Test
    void greetShouldReturnGreetingWithIncrementedId() {
        Greeting first = greetingService.greet("World");
        Greeting second = greetingService.greet("Spring");

        assertEquals(1L, first.getId());
        assertEquals(2L, second.getId());
    }

    @Test
    void greetShouldReturnFormattedContent() {
        Greeting greeting = greetingService.greet("World");

        assertNotNull(greeting);
        assertEquals("Hello, World!", greeting.getContent());
    }

    @Test
    void greetShouldHandleCustomName() {
        Greeting greeting = greetingService.greet("Spring Boot");

        assertEquals("Hello, Spring Boot!", greeting.getContent());
    }

    @Test
    void getSimpleGreetingShouldReturnFormattedString() {
        String result = greetingService.getSimpleGreeting("World");

        assertEquals("Hello, World!", result);
    }

    @Test
    void getSimpleGreetingShouldHandleEmptyName() {
        String result = greetingService.getSimpleGreeting("");

        assertEquals("Hello, !", result);
    }
}
