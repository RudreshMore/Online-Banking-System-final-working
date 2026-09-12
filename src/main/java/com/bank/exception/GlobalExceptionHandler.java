package com.bank.exception;

import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(InsufficientBalanceException.class)
    public String handleBalanceException(
            InsufficientBalanceException ex, Model model) {

        model.addAttribute("errorMessage", ex.getMessage());
        return "error";
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public String handleNotFoundException(
            ResourceNotFoundException ex, Model model) {

        model.addAttribute("errorMessage", ex.getMessage());
        return "error";
    }

    @ExceptionHandler(Exception.class)
    public String handleGenericException(
            Exception ex, Model model) {

        model.addAttribute("errorMessage", "Something went wrong!");
        return "error";
    }
}
