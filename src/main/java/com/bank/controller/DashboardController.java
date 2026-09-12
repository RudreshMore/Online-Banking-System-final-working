package com.bank.controller;

import java.security.Principal;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.bank.entity.Account;
import com.bank.entity.User;
import com.bank.service.AccountService;
import com.bank.service.UserService;

@Controller
public class DashboardController {

    private final UserService userService;
    private final AccountService accountService;
    
    

    public DashboardController(UserService userService,
                               AccountService accountService) {
        this.userService = userService;
        this.accountService = accountService;
    }

    @GetMapping("/dashboard")
    public String dashboard(Model model, Principal principal) {

        User user = userService.findByEmail(principal.getName());

        // 🚫 BLOCK ADMIN FROM USER DASHBOARD
        if (user.getRole().equals("ROLE_ADMIN")) {
            return "redirect:/admin/dashboard";
        }

        Account account = accountService.getAccountByUser(user);

        model.addAttribute("user", user);
        model.addAttribute("account", account);

        return "dashboard";
    }

    @GetMapping("/profile")
    public String profile(Model model, Principal principal) {

        User user = userService.findByEmail(principal.getName());
        Account account = accountService.getAccountByUser(user);

        model.addAttribute("user", user);
        model.addAttribute("account", account);

        return "profile";
    }

    
}
