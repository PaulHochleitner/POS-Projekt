package com.tactics.simulator.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Forwards SPA routes to index.html so React Router can handle client-side routing.
 * Static files under /assets/** and the API under /api/** take precedence because
 * Spring's static-resource handler matches before controllers, and REST controllers
 * own their explicit @RequestMapping paths.
 *
 * NOTE: If you add a new top-level React route (e.g. "/settings"), append it here.
 */
@Controller
public class SpaFallbackController {

    @GetMapping({
            "/",
            "/login",
            "/register",
            "/dashboard",
            "/editor/**",
            "/shared/**",
            "/teams/**",
            "/library/**",
            "/compare/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
