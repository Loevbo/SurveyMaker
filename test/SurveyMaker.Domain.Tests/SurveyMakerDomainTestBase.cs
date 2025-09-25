using Volo.Abp.Modularity;

namespace SurveyMaker;

/* Inherit from this class for your domain layer tests. */
public abstract class SurveyMakerDomainTestBase<TStartupModule> : SurveyMakerTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
