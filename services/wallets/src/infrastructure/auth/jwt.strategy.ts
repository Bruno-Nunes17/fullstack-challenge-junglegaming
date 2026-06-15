import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    
    const internalIssuer = 'http://keycloak:8080/realms/crash-game';
    
    const externalIssuer = 'http://localhost:8080/realms/crash-game';

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${internalIssuer}/protocol/openid-connect/certs`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: externalIssuer,
      algorithms: ['RS256'],
    });
  }

  validate(payload: { sub: string; preferred_username: string }) {
    return { userId: payload.sub, username: payload.preferred_username };
  }
}
