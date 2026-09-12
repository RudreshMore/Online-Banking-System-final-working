package com.bank.controller;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.bank.entity.Account;
import com.bank.entity.Transaction;
import com.bank.entity.User;
import com.bank.repository.AccountRepository;
import com.bank.repository.UserRepository;
import com.bank.service.AccountService;
import com.bank.service.TransactionService;

@Controller
@RequestMapping("/admin")
public class AdminController {

	private final UserRepository userRepository;
	private final AccountRepository accountRepository;
	private final TransactionService transactionService;
	private final AccountService accountService;

	public AdminController(UserRepository userRepository, AccountRepository accountRepository,
			TransactionService transactionService, AccountService accountService) {
		this.userRepository = userRepository;
		this.accountRepository = accountRepository;
		this.transactionService = transactionService;
		this.accountService = accountService;
	}

	// ✅ ADMIN DASHBOARD
	@GetMapping("/dashboard")
	public String dashboard(Model model) {
		model.addAttribute("users", userRepository.findAll());
		return "admin-dashboard";
	}

	// ✅ TOGGLE USER ACTIVE / BLOCK
	@GetMapping("/toggle/{id}")
	public String toggleUser(@PathVariable Long id) {

		User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));

		user.setActive(!user.isActive());
		userRepository.save(user);

		return "redirect:/admin/dashboard";
	}

	// ✅ ADMIN DEPOSIT
	@PostMapping("/deposit")
	public String adminDeposit(@RequestParam Long userId, @RequestParam double amount, RedirectAttributes ra) {

		try {
			accountService.adminDeposit(userId, amount);
			ra.addFlashAttribute("success", "₹" + amount + " deposited successfully");
		} catch (Exception e) {
			ra.addFlashAttribute("error", e.getMessage());
		}

		return "redirect:/admin/dashboard";
	}

	// ✅ VIEW USER TRANSACTIONS
	@GetMapping("/transactions/{userId}")
	public String viewTransactions(@PathVariable Long userId, Model model) {

		User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

		Account account = accountRepository.findByUser(user)
				.orElseThrow(() -> new RuntimeException("Account not found"));

		List<Transaction> tx = transactionService.getTransactions(account.getAccountNumber());

		model.addAttribute("transactions", tx);
		model.addAttribute("user", user);

		return "admin-transactions";
	}
}
