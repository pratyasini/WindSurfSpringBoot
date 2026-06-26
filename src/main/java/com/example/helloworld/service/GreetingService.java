package com.example.helloworld.service;

import com.example.helloworld.model.Greeting;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicLong;

@Service
public class GreetingService {

    private static final String TEMPLATE = "Hello, %s!";
    private final AtomicLong counter = new AtomicLong();

    public Greeting greet(String name) {
        return new Greeting(counter.incrementAndGet(), String.format(TEMPLATE, name));
    }

    public String getSimpleGreeting(String name) {
        return String.format(TEMPLATE, name);
    }
}
