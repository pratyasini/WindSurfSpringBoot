package com.example.helloworld.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GreetingTest {

    @Test
    void shouldReturnCorrectId() {
        Greeting greeting = new Greeting(1L, "Hello, World!");

        assertEquals(1L, greeting.getId());
    }

    @Test
    void shouldReturnCorrectContent() {
        Greeting greeting = new Greeting(1L, "Hello, World!");

        assertEquals("Hello, World!", greeting.getContent());
    }

    @Test
    void shouldHandleDifferentValues() {
        Greeting greeting = new Greeting(42L, "Hello, Spring!");

        assertEquals(42L, greeting.getId());
        assertEquals("Hello, Spring!", greeting.getContent());
    }
}
