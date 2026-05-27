package com.digitaltwin.repository;

import com.digitaltwin.models.Activity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface ActivityRepository extends MongoRepository<Activity, String> {
    
    List<Activity> findByUserIdOrderByStartTimeDesc(String userId, Pageable pageable);
    
    List<Activity> findByUserIdOrderByStartTimeDesc(String userId);
    
    List<Activity> findByUserIdAndStartTimeBetweenOrderByStartTimeAsc(String userId, Date start, Date end);
    
    long countByUserIdAndStartTimeGreaterThanEqual(String userId, Date start);
    
    Optional<Activity> findFirstByUserIdOrderByStartTimeDesc(String userId);

    long countByUserIdAndCategoryAndStartTimeGreaterThanEqual(String userId, String category, Date start);
}
