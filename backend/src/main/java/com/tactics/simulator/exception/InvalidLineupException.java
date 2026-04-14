package com.tactics.simulator.exception;

import java.util.List;

public class InvalidLineupException extends RuntimeException {

    private final List<String> errors;

    public InvalidLineupException(List<String> errors) {
        super("Invalid lineup: " + String.join(", ", errors));
        this.errors = errors;
    }

    public List<String> getErrors() {
        return errors;
    }
}
