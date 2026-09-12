package com.bank.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.bank.entity.User;
import com.bank.repository.UserRepository;
import com.bank.service.AccountService;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initAdmin(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AccountService accountService) {

        return args -> {

            User admin = userRepository.findByEmail("admin@bank.com")
                    .orElse(null);

            if (admin == null) {
                admin = new User();
                admin.setName("Admin");
                admin.setEmail("admin@bank.com");
                admin.setMobileNumber("9999999999"); // 🔥 REQUIRED
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole("ROLE_ADMIN");
                admin.setActive(true);

                admin = userRepository.save(admin);
            }

            // Create account if not exists
            try {
                accountService.getAccountByUser(admin);
            } catch (Exception e) {
                accountService.createAccount(admin);
            }

            System.out.println("✅ ADMIN READY");
        };
    }
}
