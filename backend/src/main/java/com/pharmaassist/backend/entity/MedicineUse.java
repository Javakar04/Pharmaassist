package com.pharmaassist.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "medicine_uses")
public class MedicineUse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;

    @Column(name = "use_category", length = 120)
    private String useCategory;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 200)
    private String source;

    @Column(name = "verified_by")
    private Long verifiedBy;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Medicine getMedicine() { return medicine; }
    public void setMedicine(Medicine medicine) { this.medicine = medicine; }
    public String getUseCategory() { return useCategory; }
    public void setUseCategory(String useCategory) { this.useCategory = useCategory; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public Long getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(Long verifiedBy) { this.verifiedBy = verifiedBy; }
}
