import * as chalk from 'chalk';
import auth from '../../../../Auth';
import { Logger } from '../../../../cli';
import Command, { CommandOption } from '../../../../Command';
import GlobalOptions from '../../../../GlobalOptions';
import request from '../../../../request';
import Utils from '../../../../Utils';
import commands from '../../commands';

interface CommandArgs {
  options: Options;
}

interface Options extends GlobalOptions {
  workload?: string;
}

class TenantStatusListCommand extends Command {
  public get name(): string {
    return commands.TENANT_STATUS_LIST;
  }

  public get description(): string {
    return 'Gets health status of the different services in Microsoft 365';
  }

  public getTelemetryProperties(args: CommandArgs): any {
    const telemetryProps: any = super.getTelemetryProperties(args);
    telemetryProps.workload = args.options.workload;
    return telemetryProps;
  }

  public commandAction(logger: Logger, args: CommandArgs, cb: (err?: any) => void): void {
    if (this.verbose) {
      logger.log(`Getting the health status of the different services in Microsoft 365.`);
    }

    const serviceUrl: string = 'https://manage.office.com/api/v1.0';
    const statusEndpoint: string = typeof args.options.workload !== 'undefined' ? `ServiceComms/CurrentStatus?$filter=Workload eq '${encodeURIComponent(args.options.workload)}'` : 'ServiceComms/CurrentStatus';
    const tenantId: string = Utils.getTenantIdFromAccessToken(auth.service.accessTokens[auth.defaultResource].value);

    const requestOptions: any = {
      url: `${serviceUrl}/${tenantId}/${statusEndpoint}`,
      headers: {
        accept: 'application/json;odata.metadata=none'
      },
      json: true
    };

    request
      .get(requestOptions)
      .then((res: any): void => {
        if (args.options.output === 'json') {
          logger.log(res);
        }
        else {
          logger.log(res.value.map((r: any) => {
            return {
              Name: r.WorkloadDisplayName,
              Status: r.StatusDisplayName
            }
          }));
        }

        if (this.verbose) {
          logger.log(chalk.green('DONE'));
        }
        cb();
      }, (err: any): void => this.handleRejectedODataJsonPromise(err, logger, cb));
  }

  public options(): CommandOption[] {
    const options: CommandOption[] = [
      {
        option: '-w, --workload [workload]',
        description: 'Retrieve service status for the specified service. If not provided, will list the current service status of all services'
      }
    ];

    const parentOptions: CommandOption[] = super.options();
    return options.concat(parentOptions);
  }
}

module.exports = new TenantStatusListCommand();