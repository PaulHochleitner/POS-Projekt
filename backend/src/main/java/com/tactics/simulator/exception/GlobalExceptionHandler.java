package com.tactics.simulator.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleResourceNotFound(ResourceNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Resource Not Found");
        problem.setType(URI.create("https://api.tactics-simulator.com/errors/not-found"));
        return problem;
    }

    @ExceptionHandler(InvalidLineupException.class)
    public ProblemDetail handleInvalidLineup(InvalidLineupException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setTitle("Invalid Lineup");
        problem.setType(URI.create("https://api.tactics-simulator.com/errors/invalid-lineup"));
        problem.setProperty("errors", ex.getErrors());
        return problem;
    }

    @ExceptionHandler(TacticNotPublicException.class)
    public ProblemDetail handleTacticNotPublic(TacticNotPublicException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setTitle("Tactic Not Public");
        problem.setType(URI.create("https://api.tactics-simulator.com/errors/not-public"));
        return problem;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .toList();
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Validation failed");
        problem.setTitle("Validation Error");
        problem.setType(URI.create("https://api.tactics-simulator.com/errors/validation"));
        problem.setProperty("errors", errors);
        return problem;
    }
}
