using Volo.Abp.Modularity;

namespace SurveyMaker;

public abstract class SurveyMakerApplicationTestBase<TStartupModule> : SurveyMakerTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
