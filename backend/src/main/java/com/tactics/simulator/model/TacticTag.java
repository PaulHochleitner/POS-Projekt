package com.tactics.simulator.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "tactic_tags")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TacticTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String name;
}
