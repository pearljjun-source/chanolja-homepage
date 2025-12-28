export function OrganizationJsonLd() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '차놀자 CHANOLJA',
    alternateName: '지에스렌트카',
    url: process.env.NEXT_PUBLIC_URL || 'https://차놀자.net',
    logo: `${process.env.NEXT_PUBLIC_URL || 'https://차놀자.net'}/images/logo.png`,
    description: '27년 자동차 업계 경력, 전국 120개 지점 운영. 렌트카 창업, 법인 설립, 캠핑카 사업까지.',
    foundingDate: '1998',
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      value: 120,
      unitText: '지점',
    },
    areaServed: {
      '@type': 'Country',
      name: 'South Korea',
    },
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'Korean',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function WebsiteJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://차놀자.net'

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '차놀자 CHANOLJA',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/branches?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function LocalBusinessJsonLd({
  name,
  address,
  telephone,
  latitude,
  longitude,
}: {
  name: string
  address?: string | null
  telephone?: string | null
  latitude?: number | null
  longitude?: number | null
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'AutoRental',
    name: `차놀자 ${name}`,
    address: address
      ? {
          '@type': 'PostalAddress',
          streetAddress: address,
          addressCountry: 'KR',
        }
      : undefined,
    telephone: telephone || undefined,
    geo: latitude && longitude
      ? {
          '@type': 'GeoCoordinates',
          latitude,
          longitude,
        }
      : undefined,
    parentOrganization: {
      '@type': 'Organization',
      name: '차놀자 CHANOLJA',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[]
}) {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://차놀자.net'

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
