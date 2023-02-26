import { SetMetadata } from '@nestjs/common';
import { BodyRestrictedChecker } from './EndpointRestrictedAccess/BodyRestrictedChecker';
import { ParamRestrictedChecker } from './EndpointRestrictedAccess/ParamRestrictedChecker';
import { QueryRestrictedChecker } from './EndpointRestrictedAccess/QueryRestrictedChecker';
import { RestrictedCheckerInterface } from './EndpointRestrictedAccess/RestrictedCheckerInterface';

export class RestrictedAccessMethod {
  static readonly query = new QueryRestrictedChecker();
  static readonly body = new BodyRestrictedChecker();
  static readonly params = new ParamRestrictedChecker();
}
export type RestrictedAccessType = {
  field: string;
  throwException: boolean;
  validator: RestrictedCheckerInterface;
};
export const IS_PUBLIC_ENDPOINT_KEY = 'isPublicEndpoint';
export const IS_ENDPOINT_RESTRICTED = 'IS_ENDPOINT_RESTRICTED';

export const EndpointIsPublic = () => SetMetadata(IS_PUBLIC_ENDPOINT_KEY, true);
export const EndpointRestrictedAccess = (
  field = 'id',
  validator: RestrictedAccessMethod = RestrictedAccessMethod.query,
  throwException = false,
) =>
  SetMetadata(IS_ENDPOINT_RESTRICTED, {
    field,
    validator,
    throwException,
  });
