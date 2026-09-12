package com.bank.service;

import com.bank.entity.User;

public interface UserService {
	User registerUser(User user);

	User findByEmail(String email);
}
