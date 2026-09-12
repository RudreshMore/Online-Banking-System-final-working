package com.bank.controller;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.bank.entity.User;
import com.bank.repository.UserRepository;
import com.bank.service.AccountService;

@Controller
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccountService accountService;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          AccountService accountService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.accountService = accountService;
    }

    @GetMapping("/login")
    public String loginPage() {
        return "login";
    }

    @GetMapping("/register")
    public String registerPage(Model model) {
        model.addAttribute("user", new User());
        return "register";
    }

    @PostMapping("/register")
    public String registerUser(
            @RequestParam String name,
            @RequestParam String email,
            @RequestParam String mobileNumber,
            @RequestParam String password,
            Model model) {

        if (userRepository.findByEmail(email).isPresent()) {
            model.addAttribute("error", "Email already registered");
            return "register";
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setMobileNumber(mobileNumber);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole("ROLE_USER");
        user.setActive(true);

        // ✅ SAVE USER FIRST
        user = userRepository.save(user);

        // ✅ CREATE ACCOUNT IMMEDIATELY
        accountService.createAccount(user);

        model.addAttribute("success", "Account created successfully! Please login.");
        return "login";
    }
}
