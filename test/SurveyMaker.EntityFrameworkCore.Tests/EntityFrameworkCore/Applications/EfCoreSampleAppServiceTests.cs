using SurveyMaker.Samples;
using Xunit;

namespace SurveyMaker.EntityFrameworkCore.Applications;

[Collection(SurveyMakerTestConsts.CollectionDefinitionName)]
public class EfCoreSampleAppServiceTests : SampleAppServiceTests<SurveyMakerEntityFrameworkCoreTestModule>
{

}
