import React from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import { titleCase } from '../../utils/formatters.js';

export default function AppBreadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length <= 1) return null;
  let href = '';
  return (
    <Breadcrumb mb={4} fontSize="13px" color="brand.muted">
      {parts.map((part) => {
        href += `/${part}`;
        return (
          <BreadcrumbItem key={href}>
            <BreadcrumbLink as={Link} to={href}>{titleCase(part)}</BreadcrumbLink>
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
}
