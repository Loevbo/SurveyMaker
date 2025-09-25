using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SurveyMaker.Data;
using Volo.Abp.DependencyInjection;

namespace SurveyMaker.EntityFrameworkCore;

public class EntityFrameworkCoreSurveyMakerDbSchemaMigrator
    : ISurveyMakerDbSchemaMigrator, ITransientDependency
{
    private readonly IServiceProvider _serviceProvider;

    public EntityFrameworkCoreSurveyMakerDbSchemaMigrator(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task MigrateAsync()
    {
        /* We intentionally resolving the SurveyMakerDbContext
         * from IServiceProvider (instead of directly injecting it)
         * to properly get the connection string of the current tenant in the
         * current scope.
         */

        await _serviceProvider
            .GetRequiredService<SurveyMakerDbContext>()
            .Database
            .MigrateAsync();
    }
}
