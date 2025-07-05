export const jsonLdContext = {
  "@context": {
    "@vocab": "https://groundline.dev/ontology/",
    "name": "http://schema.org/name",
    "entityType": "http://schema.org/additionalType",
    "observations": "http://schema.org/description",
    "relationType": "http://schema.org/relationType",
    "knows": "http://xmlns.com/foaf/0.1/knows",
    "properties": "http://schema.org/additionalProperty",
    "from": {
      "@id": "http://schema.org/source",
      "@type": "@id"
    },
    "to": {
      "@id": "http://schema.org/target",
      "@type": "@id"
    }
  }
}; 