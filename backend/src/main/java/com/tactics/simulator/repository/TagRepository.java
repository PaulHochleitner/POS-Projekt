package com.tactics.simulator.repository;

import com.tactics.simulator.model.TacticTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TagRepository extends JpaRepository<TacticTag, Long> {

    Optional<TacticTag> findByName(String name);
}
