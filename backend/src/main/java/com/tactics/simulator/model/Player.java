package com.tactics.simulator.model;

import com.tactics.simulator.model.enums.Position;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "players")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @Min(1)
    @Max(99)
    @Column(nullable = false)
    private Integer number;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Position position;

    @Min(1)
    @Max(99)
    private Integer pace;

    @Min(1)
    @Max(99)
    private Integer passing;

    @Min(1)
    @Max(99)
    private Integer shooting;

    @Min(1)
    @Max(99)
    private Integer defending;

    @Min(1)
    @Max(99)
    private Integer physical;

    @Min(1)
    @Max(99)
    private Integer dribbling;

    private String imageUrl;

    @Column(length = 2000)
    private String notes;
}
