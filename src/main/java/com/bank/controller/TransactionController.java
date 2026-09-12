package com.bank.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.bank.entity.Account;
import com.bank.entity.Transaction;
import com.bank.entity.User;
import com.bank.service.AccountService;
import com.bank.service.TransactionService;
import com.bank.service.UserService;

@Controller
public class TransactionController {

    private final UserService userService;
    private final AccountService accountService;
    private final TransactionService transactionService;

    public TransactionController(UserService userService,
                                 AccountService accountService,
                                 TransactionService transactionService) {
        this.userService = userService;
        this.accountService = accountService;
        this.transactionService = transactionService;
    }

    // 🔹 USER TRANSACTIONS
    @GetMapping("/transactions")
    public String userTransactions(Model model, Principal principal) {

        User user = userService.findByEmail(principal.getName());
        Account account = accountService.getAccountByUser(user);

        List<Transaction> transactions =
                transactionService.getTransactions(account.getAccountNumber());

        model.addAttribute("transactions", transactions);
        return "transactions";
    }
}
