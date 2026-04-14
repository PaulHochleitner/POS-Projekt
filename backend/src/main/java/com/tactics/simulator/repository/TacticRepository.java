package com.tactics.simulator.repository;

import com.tactics.simulator.model.Tactic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TacticRepository extends JpaRepository<Tactic, Long>, JpaSpecificationExecutor<Tactic> {

    Optional<Tactic> findByUuid(UUID uuid);

    @Query("SELECT t FROM Tactic t JOIN t.tags tag WHERE tag.name IN :tagNames " +
           "GROUP BY t HAVING COUNT(DISTINCT tag.name) = :tagCount")
    List<Tactic> findByAllTags(@Param("tagNames") List<String> tagNames, @Param("tagCount") long tagCount);

    @Query("SELECT t FROM Tactic t WHERE LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Tactic> searchByNameOrDescription(@Param("search") String search);
}
