package com.tactics.simulator.repository;

import com.tactics.simulator.model.TacticVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TacticVersionRepository extends JpaRepository<TacticVersion, Long> {

    List<TacticVersion> findByTacticIdOrderByVersionNumberDesc(Long tacticId);

    Optional<TacticVersion> findFirstByTacticIdOrderByVersionNumberDesc(Long tacticId);

    @Query("SELECT COALESCE(MAX(v.versionNumber), 0) FROM TacticVersion v WHERE v.tactic.id = :tacticId")
    int findMaxVersionNumberByTacticId(@Param("tacticId") Long tacticId);
}
