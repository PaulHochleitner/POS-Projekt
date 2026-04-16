package com.tactics.simulator.repository;

import com.tactics.simulator.model.TacticTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TagRepository extends JpaRepository<TacticTag, Long> {

    Optional<TacticTag> findByName(String name);

    /**
     * Returns only tags that are used by at least one tactic belonging to the given user.
     */
    @Query("SELECT DISTINCT tag FROM TacticTag tag JOIN Tactic t ON tag MEMBER OF t.tags " +
           "WHERE t.user.id = :userId ORDER BY tag.name")
    List<TacticTag> findTagsByUserId(@Param("userId") Long userId);
}
