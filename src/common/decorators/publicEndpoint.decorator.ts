import { SetMetadata } from '@nestjs/common';

export enum RestrictedAccessMethod {
  query,
  body,
  params,
}
export type RestrictedAccessType = {
  field: string;
  method: RestrictedAccessMethod;
  replaceIfHappened: boolean;
};
export const IS_PUBLIC_ENDPOINT_KEY = 'isPublicEndpoint';
export const IS_ENDPOINT_RESTRICTED = 'IS_ENDPOINT_RESTRICTED';

export const EndpointIsPublic = () => SetMetadata(IS_PUBLIC_ENDPOINT_KEY, true);

export const EndpointRestrictedAccess = (
  field = 'id',
  method = RestrictedAccessMethod.query,
  replaceIfHappened = true,
) =>
  SetMetadata(IS_ENDPOINT_RESTRICTED, {
    field,
    method,
    replaceIfHappened,
  });
