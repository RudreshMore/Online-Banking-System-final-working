package com.bank.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.bank.service.TransactionService;

@Controller
public class AdminTransactionController {

    private final TransactionService transactionService;

    public AdminTransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    // 🔹 ADMIN – ALL TRANSACTIONS
    @GetMapping("/admin/transactions")
    public String allTransactions(Model model) {

        model.addAttribute("transactions",
                transactionService.getAllTransactions());

        return "admin-transactions";
    }
}
