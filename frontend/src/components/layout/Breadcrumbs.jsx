import React from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import { titleCase } from '../../utils/formatters.js';

/** Path segment → breadcrumb label (slug stays in the URL; label is user-facing). */
const BREADCRUMB_SEGMENT_LABELS = {
  'games-details': 'Player Details',
  positions: 'Principles',
};

export default function AppBreadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length <= 1) return null;
  let href = '';
  return (
    <Breadcrumb mb={4} fontSize="13px" color="brand.muted">
      {parts.map((part) => {
        href += `/${part}`;
        const label = BREADCRUMB_SEGMENT_LABELS[part] || titleCase(part);
        return (
          <BreadcrumbItem key={href}>
            <BreadcrumbLink as={Link} to={href}>{label}</BreadcrumbLink>
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
}
