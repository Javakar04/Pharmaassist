package com.pharmaassist.backend.dto;

public class MedicineDtos {

    public record MedicineRequest(
            String name, String genericName, String activeIngredient, String strength,
            String dosageForm, String category, String manufacturer, String storageInformation) {}

    public record MedicineUseRequest(String useCategory, String description, String source) {}
}
