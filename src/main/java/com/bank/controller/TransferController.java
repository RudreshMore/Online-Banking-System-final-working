package com.bank.controller;

import java.security.Principal;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import com.bank.entity.Account;
import com.bank.entity.User;
import com.bank.service.AccountService;
import com.bank.service.TransferService;
import com.bank.service.UserService;

@Controller
public class TransferController {

    private final UserService userService;
    private final AccountService accountService;
    private final TransferService transferService;

    public TransferController(UserService userService,
                              AccountService accountService,
                              TransferService transferService) {
        this.userService = userService;
        this.accountService = accountService;
        this.transferService = transferService;
    }

    // ✅ SHOW TRANSFER PAGE
    @GetMapping("/transfer")
    public String showTransfer(Model model, Principal principal) {

        User user = userService.findByEmail(principal.getName());
        Account account = accountService.getAccountByUser(user);

        if (account == null) {
            model.addAttribute("errorMessage",
                    "Account not found. Please contact support.");
            return "error";
        }

        model.addAttribute("account", account);
        return "transfer";
    }

    // ✅ HANDLE TRANSFER
    @PostMapping("/transfer")
    public String doTransfer(@RequestParam String fromAccount,
                             @RequestParam String toAccount,
                             @RequestParam double amount,
                             Principal principal,
                             Model model) {

        try {
            transferService.transferMoney(fromAccount, toAccount, amount);
            return "redirect:/dashboard?transferSuccess";

        } catch (Exception e) {
            model.addAttribute("error", e.getMessage());
            return "transfer";
        }
    }
}
