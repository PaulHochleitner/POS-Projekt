package com.tactics.simulator.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tactic_versions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TacticVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tactic_id", nullable = false)
    private Tactic tactic;

    @Column(nullable = false)
    private Integer versionNumber;

    private String label;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String frames;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
